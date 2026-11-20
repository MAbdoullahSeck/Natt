# CLAUDE.md — Natt

Ce fichier est le brief permanent pour Claude Code. Lis-le en entier avant toute tâche.

## Le produit en 5 lignes

- **Natt** (« tontine » en wolof) est une application **mobile** (Android d'abord, iOS ensuite) qui digitalise la gestion des tontines au Sénégal.
- La **gérante** crée une tontine, partage un code à 6 chiffres, suit qui a payé, gère l'ordre des tours. Elle est la **cliente payante** (abonnement).
- Les **membres** rejoignent avec le code, reçoivent des rappels, paient leur cotisation **directement à la gérante** par Wave ou Orange Money.
- Utilisatrices cibles : femmes de 25 à 55 ans à Dakar, souvent peu à l'aise avec la lecture. **La simplicité est la fonctionnalité n°1.**
- Référence d'expérience : Wave et Orange Money. Utilisable sans explication.

## Règles absolues (ne jamais enfreindre)

1. **Natt ne détient jamais l'argent des cotisations.** Pas de portefeuille, pas de solde rechargeable, pas de bouton « Déposer » / « Retirer ». Raison : réglementation BCEAO (Instruction n°008-05-2015 sur la monnaie électronique). L'argent va du membre à la gérante, l'app trace et confirme seulement. Natt n'encaisse que ses propres abonnements.
2. **Une seule action principale par écran**, une question par écran dans les formulaires, gros boutons (56 px), gros textes (16 px minimum), pavé numérique intégré pour les nombres.
3. **Statuts toujours en couleur + mot** : « Payé » (vert), « En attente » (gris), « En retard » (terracotta). Jamais la couleur seule.
4. **Montants en FCFA**, format `10 000 F` (espace fine insécable comme séparateur de milliers, suffixe « F »). Dates en français (`5 décembre`, `Janv. 2027`).
5. **Pas de jargon financier**, pas de tableaux complexes, pas de graphiques dans l'app membre.
6. **Le design Figma fait foi.** Ne pas inventer d'écrans, de couleurs ou de textes. En cas de doute, demander.
7. Ne pas ajouter de fonctionnalités hors du périmètre V1 (voir `docs/cahier-des-charges.md`, section « Hors périmètre »).

## Stack

- **Expo** (dernière version stable du SDK), **TypeScript** strict, **expo-router** (navigation par fichiers).
- **Supabase** : Auth (téléphone + code SMS), Postgres avec **RLS sur toutes les tables**, Storage (captures de paiement), Edge Functions (tirage au sort, relances), `pg_cron` (relances planifiées).
- Notifications : **expo-notifications** (push).
- Police : **Nunito** (Regular, Bold) via `expo-font` / `@expo-google-fonts/nunito`.
- État serveur : `@tanstack/react-query` + client Supabase typé (`supabase gen types`).
- Textes : tous centralisés dans `src/i18n/fr.ts` (le wolof viendra plus tard ; ne jamais écrire de texte en dur dans un composant).

## Où trouver quoi

| Document | Contenu |
|---|---|
| `docs/cahier-des-charges.md` | Partie 1 : tous les écrans. Partie 2 : fonctionnalités V1 et règles métier. |
| `docs/architecture.md` | Modèle de données, RLS, flux (paiement, tirage, échange, relances), abonnements. |
| `docs/design-system.md` | Couleurs, typographie, espacements, composants. |
| `docs/plan.md` | Plan de développement étape par étape, avec critères de validation. |

## Design (Figma)

- Fichier : https://www.figma.com/design/dVf0o3jlgmFcFAtzi3IaBC/Sans-titre
- Page « Page 1 » : écrans 01 à 22 (rangée du haut) + section « V1 · Écrans ajoutés » (rangée du bas).
- Page « Natt · Composants » : composants de base (Bouton principal, Bouton secondaire, Clavier numérique, Navigation, Membre · Statut et validation, Notification).
- Si le serveur MCP Figma est connecté, utilise `get_design_context` / `get_screenshot` avec les identifiants de nœuds listés dans `docs/cahier-des-charges.md` pour reproduire chaque écran fidèlement.

## Méthode de travail

- Suis `docs/plan.md` **dans l'ordre**. Par défaut, une étape à la fois, validée avant de passer à la suivante. **On peut enchaîner plusieurs étapes quand on te le demande** : dans ce cas, un commit par étape (« Étape N : … »), poussé après chaque étape.
- Les choix faits sans validation (points ambigus, services externes absents) sont notés dans `docs/decisions.md`.
- Une étape (ou un groupe d'étapes enchaînées) = une branche + une pull request vers `main`, avec une description qui reprend les critères validés.
- Toute modification de schéma passe par une migration dans `supabase/migrations/`. Jamais de modification manuelle en production.
- Écris des tests pour la logique métier (calcul des statuts, ordre des tours, échange, limites d'abonnement, pénalités).
- Si une règle du cahier des charges est ambiguë ou contradictoire, **arrête-toi et pose la question** au lieu de deviner — sauf pendant un enchaînement d'étapes demandé : prends alors le choix le plus simple et le plus fidèle, et note-le dans `docs/decisions.md`.
- Signale immédiatement tout blocage technique (dépendance, service externe, accès manquant) au lieu de contourner en silence.

## Commandes

```bash
npm install
cp .env.example .env      # URL et clé publique du projet Supabase natt-dev
npx expo start            # lancer l'app (Expo Go ou build de développement)
npm test                  # tests Jest (jest-expo)
npm run lint              # ESLint (expo lint) + typecheck (tsc --noEmit)
npm run format            # Prettier
npx expo install <paquet> # ajouter une dépendance (versions compatibles avec le SDK)

# Base de données en ligne : projet natt-dev (réf. vzvtuthjxyjaitesnvih, eu-west-1)
# Le CLI lit SUPABASE_ACCESS_TOKEN et SUPABASE_DB_PASSWORD dans l'environnement (jamais dans un fichier).
npm run db:link           # relier le dépôt au projet (une fois)
npm run db:push           # appliquer les nouvelles migrations
npm run db:seed           # charger supabase/seed.sql (refusé si la base contient déjà des profils)
npm run db:test           # tests pgTAP sur natt-dev (transactions annulées)
npm run db:types          # régénérer src/lib/database.types.ts depuis natt-dev
npm run fn:deploy         # déployer les Edge Functions sur natt-dev (regroupement côté serveur, sans Docker)

# Sessions cloud (pas d'accès direct à Postgres, seulement HTTPS) : mêmes opérations par l'API de gestion
npm run db:api:migrations # équivalent de db:push
npm run db:api:tests      # équivalent de db:test
python3 scripts/supabase_api.py sql "select …"   # requête ponctuelle

# Stack locale Docker (facultative, utilisée par les tests e2e)
npm run db:local:start | db:local:reset | db:local:test | db:local:types
npx supabase functions serve  # Edge Functions en local
npm run e2e               # tests de bout en bout (export web + Playwright, stack locale uniquement)
```

Connexion de test (natt-dev et local) : numéros `77 000 00 01` à `77 000 00 20`, code `123456` (aucun SMS envoyé). Aminata (gérante) = `77 000 00 01`.

Mise en production (fournisseur SMS, secrets, Edge Functions, EAS) : voir `docs/deploiement.md`.

## Conventions de code (étape 0)

- Écrans dans `app/` (expo-router), tout le reste dans `src/`. Alias d'import `@/` → `src/`.
- Thème : `src/theme` (palettes `clair` / `sombre`, `typographie`, `espacements`, `rayons`, `tailles`). Couleurs **toujours** via `useCouleurs()` ou `const useStyles = creerStyles((couleurs) => ({ … }))` puis `const styles = useStyles()` (mode sombre). Une règle ESLint interdit toute couleur hexadécimale en dur hors de `src/theme`. Fond plein sous un texte blanc : `fondAccent` (pas `terracotta`).
- Textes : `src/i18n/fr.ts`, importés via `textes` depuis `@/i18n`.
- Formats : `formatMontant`, `formatDate`, `formatMoisAnnee`, `formatHeure` dans `src/lib/format.ts`.
- Composants de base : `src/components` (importer depuis `@/components`). Toujours utiliser `Texte` plutôt que `Text`.
- Icônes : `lucide-react-native`, taille 24, `strokeWidth={2}`.
- Logique métier pure et testée : `src/domain`.
- Démonstration interne des composants : route `/demo` (en développement seulement).
- Accès aux données : hooks react-query dans `src/data` ; morceaux d'écrans réutilisés dans `src/features`.
- Chaque écran qui charge des données affiche `Chargement`, puis `EtatErreur` (avec « Réessayer ») en cas d'échec.
- Les erreurs métier SQL sont des codes courts (`raise exception 'limite_atteinte'`) traduits dans `textes.erreurs.codes`.
- Wave / Orange Money : tout passe par `src/lib/paiementMobile.ts`.
- Réglages publics (numéros d'aide, Wave de Natt) : `src/config.ts`, via variables `EXPO_PUBLIC_*`.

## Conventions base de données (étape 1)

- Une migration par changement dans `supabase/migrations/`, jamais de modification manuelle.
- Chaque nouvelle table : RLS activée, `revoke all ... from anon`, aucune écriture directe pour `authenticated` (écritures via fonctions `security definer` avec `set search_path = ''`).
- Appartenance : utiliser `public.est_membre(tontine_id)` / `public.est_gerante(tontine_id)` dans les politiques.
- Prénom et téléphone des autres membres : vue `profils_publics` (la table `profils` ne montre que son propre profil).
- `evenements` est en ajout seul : un déclencheur bloque update, delete et truncate pour tout le monde.
- Après chaque migration : vérifier en local si possible (`npm run db:local:reset && npm run db:local:test`), puis `npm run db:push` (ou `db:api:migrations`), `npm run db:test` (ou `db:api:tests`) et `npm run db:types`.
- **RLS activée par défaut** : sur natt-dev, le déclencheur `ensure_rls` active la RLS sur toute nouvelle table de `public`. Chaque migration doit quand même l'activer explicitement et créer ses politiques (sinon la table est illisible pour l'app). Ne jamais compter sur une table sans RLS.
- Ne jamais modifier natt-dev à la main : toute modification passe par une migration.
- Données de démonstration : `supabase/seed.sql` (Aminata, Fatou, Moussa… ; Aminata = `221770000001`, code SMS de test `123456`), chargées sur natt-dev.
- Fonctions réservées au système (`appliquer_tirage`, `preparer_relances`, `activer_abonnement`…) : `grant execute … to service_role` seulement.
- Edge Functions (`supabase/functions`) : sans dépendance externe, accès à Supabase par `fetch` (`_shared/api.ts`). `verify_jwt = false` : chaque fonction vérifie elle-même l'appelant (jeton utilisateur via `/auth/v1/user`, ou clé service vérifiée par la base). Déployées sur natt-dev.
- pg_cron appelle les Edge Functions avec l'URL et la clé service lues dans Vault (`project_url`, `service_role_key`, renseignés sur natt-dev). Contrôle : `select * from net._http_response order by created desc limit 5;`.
