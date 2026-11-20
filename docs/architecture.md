# Natt — Architecture technique V1

## 1. Vue d'ensemble

```
App Expo (Android / iOS)
  ├─ expo-router (écrans)
  ├─ react-query + client Supabase typé
  └─ expo-notifications (push)
        │
Supabase
  ├─ Auth : téléphone + code SMS
  ├─ Postgres : tables + RLS + fonctions SQL (RPC)
  ├─ Storage : bucket privé « captures »
  ├─ Edge Functions : tirage au sort, envoi des relances, push
  └─ pg_cron : relances quotidiennes (9 h, Africa/Dakar)
```

Principe : **toute règle métier sensible s'exécute côté serveur** (fonctions SQL `security definer` ou Edge Functions). Le client ne fait jamais confiance à lui-même pour : confirmer un paiement, tirer au sort, échanger des tours, vérifier les limites d'abonnement.

## 2. Arborescence cible

```
app/                      # expo-router
  (auth)/telephone.tsx, code.tsx, prenom.tsx, consentement.tsx
  (app)/(onglets)/index.tsx, notifications.tsx, profil.tsx
  (app)/creer/nom.tsx, type.tsx, montant.tsx, frequence.tsx, membres.tsx, date.tsx, cree.tsx
  (app)/rejoindre/index.tsx, reglement.tsx
  (app)/tontine/[id]/index.tsx, reglages.tsx, tours.tsx, echanger.tsx, tirage.tsx,
                     membre/[membreId].tsx, payer.tsx, paiement-envoye.tsx, fin.tsx, rapport.tsx
  (app)/abonnement.tsx
src/
  components/             # BoutonPrincipal, BoutonSecondaire, ClavierNumerique, PuceStatut,
                          # LigneMembre, CarteTontine, EnTete, NavigationBas, Interrupteur…
  theme/                  # tokens (voir design-system.md)
  i18n/fr.ts              # tous les textes
  lib/supabase.ts, database.types.ts, format.ts (montants, dates)
  domain/                 # logique pure testée : echeances, statuts, tours, abonnement
supabase/
  migrations/
  functions/tirage-au-sort/, relances/, push/
```

## 3. Modèle de données

Toutes les tables ont `id uuid primary key default gen_random_uuid()` et `created_at timestamptz default now()`. Montants en **entiers de FCFA** (`integer`).

```sql
-- Profils (1 ligne par utilisateur Auth)
create table profils (
  id uuid primary key references auth.users on delete cascade,
  prenom text not null,
  telephone text not null unique,
  consentement_at timestamptz not null,
  consentement_version text not null,
  langue text not null default 'fr',
  fondatrice boolean not null default false,
  expo_push_token text,
  created_at timestamptz default now()
);

create type type_tontine as enum ('classique', 'achat_groupe');
create type frequence as enum ('jour', 'semaine', 'mois');
create type statut_tontine as enum ('en_preparation', 'en_cours', 'terminee');

create table tontines (
  id uuid primary key default gen_random_uuid(),
  gerante_id uuid not null references profils(id),
  nom text not null,
  type type_tontine not null default 'classique',
  bien_prevu text,                       -- obligatoire si achat_groupe (check)
  montant integer not null check (montant >= 500),
  frequence frequence not null,
  nb_membres integer not null check (nb_membres between 2 and 50),
  date_debut date not null,
  code char(6) not null,
  statut statut_tontine not null default 'en_preparation',
  penalite_retard integer not null default 0,
  relance_j_moins_3 boolean not null default true,
  relance_jour_j boolean not null default true,
  relance_j_plus_1 boolean not null default true,
  cycle_precedent_id uuid references tontines(id),
  created_at timestamptz default now(),
  check (type <> 'achat_groupe' or bien_prevu is not null)
);
create unique index on tontines(code) where statut <> 'terminee';

create table reglements (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references tontines(id) on delete cascade,
  version integer not null,
  lignes text[] not null,
  created_at timestamptz default now(),
  unique (tontine_id, version)
);

create table membres (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references tontines(id) on delete cascade,
  profil_id uuid not null references profils(id),
  rang integer,                           -- position dans l'ordre des tours (1..N)
  reglement_version_acceptee integer,
  reglement_accepte_at timestamptz,
  created_at timestamptz default now(),
  unique (tontine_id, profil_id),
  unique (tontine_id, rang)
);

create table tours (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references tontines(id) on delete cascade,
  numero integer not null,                -- 1..N
  echeance date not null,
  beneficiaire_membre_id uuid references membres(id),
  verse_at timestamptz,                   -- cagnotte remise au bénéficiaire
  unique (tontine_id, numero)
);

create type statut_cotisation as enum ('a_payer', 'declare', 'paye');
create table cotisations (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  membre_id uuid not null references membres(id) on delete cascade,
  statut statut_cotisation not null default 'a_payer',
  moyen text,                             -- 'wave' | 'orange_money'
  capture_path text,                      -- Storage
  declare_at timestamptz,
  paye_at timestamptz,
  unique (tour_id, membre_id)
);
-- « en_retard » n'est pas stocké : il se calcule (règle P1, src/domain/statuts.ts) :
--   statut = 'a_payer' et echeance < aujourd'hui, ou statut = 'declare' et declare_at après l'échéance.
--   Une déclaration faite avant ou le jour de l'échéance reste « En attente ».

-- Journal en ajout seul (historique horodaté)
create table evenements (
  id uuid primary key default gen_random_uuid(),
  tontine_id uuid not null references tontines(id) on delete restrict,
  membre_id uuid references membres(id) on delete restrict,
  auteur_id uuid references profils(id) on delete restrict,
  type text not null,  -- 'declaration','confirmation','relance','penalite','penalite_annulee',
                       -- 'tirage','echange','reglement_accepte','membre_rejoint','cycle_termine'
  donnees jsonb not null default '{}',
  created_at timestamptz not null default now()
);
-- RLS : insert via fonctions serveur uniquement ; aucun update ni delete pour personne.
-- Un déclencheur bloque update, delete et truncate pour tous les rôles (postgres et service_role compris).
-- Les clés étrangères sont en « restrict » : une tontine qui a un historique ne peut pas être supprimée
-- (l'historique ne disparaît jamais ; voir D2 pour l'anonymisation).

create table evenements_calendrier (
  id uuid primary key default gen_random_uuid(),
  nom text not null,          -- 'Tabaski', 'Korité', 'Rentrée scolaire'…
  date_debut date not null,
  date_fin date
);

create type palier as enum ('starter', 'pro', 'illimite');
create table abonnements (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references profils(id),
  palier palier not null,
  periodicite text not null check (periodicite in ('mensuel','annuel')),
  statut text not null check (statut in ('actif','expire','en_attente')),
  expire_at timestamptz,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profil_id uuid not null references profils(id),
  tontine_id uuid references tontines(id),
  type text not null,
  titre text not null,
  corps text not null,
  lu_at timestamptz,
  created_at timestamptz default now()
);
```

## 4. Sécurité (RLS)

- `profils` : chacun lit et crée son propre profil (avec le numéro de son compte), et ne modifie que `prenom`, `langue` et `expo_push_token` (pas `fondatrice`).
- Vue `profils_publics` (`id`, `prenom`, `telephone`) : son propre profil et ceux des personnes qui partagent une tontine avec soi. La table `profils` n'est jamais lue pour les autres, afin de ne pas exposer le consentement ni le jeton push.
- `tontines`, `membres`, `tours`, `cotisations`, `reglements` : lecture pour les membres de la tontine ; écriture **uniquement via les fonctions RPC** ci-dessous.
- `evenements` : lecture pour les membres de la tontine ; aucune écriture directe.
- Storage `captures` : bucket privé ; le membre dépose sa capture, la gérante de la tontine et le membre la lisent.

## 5. Fonctions serveur (RPC / Edge Functions)

| Fonction | Qui | Effet |
|---|---|---|
| `creer_tontine(...)` | utilisatrice | Vérifie la limite du palier (B1–B3), génère un code unique, crée la tontine, le règlement v1, la gérante comme membre rang 1, les tours et les échéances. |
| `rejoindre_tontine(code, version_reglement)` | utilisatrice | Vérifie le code, la place disponible et l'acceptation du règlement ; ajoute le membre ; passe la tontine en `en_cours` quand elle est complète et que la date de début est atteinte. |
| `declarer_paiement(cotisation_id, moyen, capture_path?)` | membre | `a_payer` → `declare` + événement. |
| `confirmer_paiement(cotisation_id)` | gérante | → `paye` + événement + notification au membre. |
| `marquer_verse(tour_id)` | gérante | Enregistre la remise de la cagnotte ; clôt la tontine au dernier tour. |
| `echanger_tours(membre_a, membre_b)` | gérante | Uniquement des tours non versés ; met à jour les rangs et les bénéficiaires ; événement + 2 notifications. |
| `tirage-au-sort` (Edge) | gérante | Une fois par cycle ; mélange cryptographiquement sûr ; enregistre l'ordre, la date et la graine ; notifie tous les membres. |
| `relancer(tontine_id, membre_id?)` | gérante | Relance immédiate, au plus une par membre et par jour. |
| `relances` (Edge + pg_cron 9 h) | système | J-3 / J / J+1 selon les réglages ; récapitulatif des retards à la gérante à J+1 ; applique les pénalités. |
| `relancer_cycle(tontine_id)` | gérante | Crée le cycle suivant (mêmes paramètres, nouveau code, `cycle_precedent_id`) et invite les mêmes membres. |
| `suggestions_calendrier(date_debut, frequence, nb_membres)` | utilisatrice | Retourne les événements qui tombent pendant le cycle et une date de début ajustée proposée. |

## 6. Paiement (rappel de la règle n°1)

Natt ne reçoit, ne garde et ne transfère jamais l'argent des cotisations. « Payer » ouvre l'application Wave ou Orange Money du téléphone avec les informations de la gérante. Points à vérifier pendant le développement : liens profonds disponibles (schéma d'URL de chaque application), possibilité de préremplir le numéro et le montant ; à défaut, afficher et copier en un geste le numéro et le montant.

## 7. Authentification par SMS

Supabase Auth par téléphone nécessite un fournisseur SMS (Twilio, MessageBird, Vonage…). Vérifier la délivrabilité vers les opérateurs sénégalais (Orange, Free, Expresso) et le coût par SMS avant le lancement. **À signaler si non configuré : c'est bloquant pour l'étape 2.**

## 8. Notifications

- Jeton push Expo enregistré dans `profils.expo_push_token` après l'inscription.
- Chaque notification est aussi écrite dans la table `notifications` (écran 22), pour fonctionner même si le push échoue.
