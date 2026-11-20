# Natt — Mise en production : ce qui reste à configurer

Tout ce qui suit demande un compte ou un secret que seule la propriétaire du projet possède.
Rien de tout cela ne doit être commité dans le dépôt.

## 1. Projet Supabase de développement : natt-dev ✅

Fait : projet `natt-dev` (réf. `vzvtuthjxyjaitesnvih`, eu-west-1) relié, 11 migrations appliquées, seed chargé, tests pgTAP passés sur le projet.

- URL et clé publique : dans `.env.example` (à copier en `.env`).
- Nouvelles migrations : `npm run db:push` (poste de développement, avec `SUPABASE_ACCESS_TOKEN` et `SUPABASE_DB_PASSWORD` dans l'environnement) ou `npm run db:api:migrations` (session cloud).
- Pour la **production**, créer un second projet (ex. `natt-prod`) et refaire `supabase link` + `db push`, **sans** le seed.

## 2. Fournisseur SMS (bloquant pour l'inscription réelle)

Sur natt-dev, l'authentification par téléphone est activée avec un fournisseur Twilio **factice** et 20 numéros de test (`221770000001` à `221770000020`, code `123456`, valables jusqu'au 20 novembre 2027). Aucun autre numéro ne peut recevoir de code.

Pour de vrais SMS :
1. Choisir un fournisseur (Twilio, MessageBird, Vonage…) et **vérifier la délivrabilité vers Orange, Free et Expresso** et le coût par SMS.
2. Dans Supabase : Authentication → Sign In / Providers → Phone : remplacer les identifiants factices par les vrais.
3. Modèle du SMS (déjà configuré) : `Ton code Natt : {{ .Code }}`.

## 3. Edge Functions

```bash
npx supabase functions deploy tirage-au-sort
npx supabase functions deploy push
npx supabase functions deploy relances
```
Elles n'ont besoin d'aucun secret supplémentaire : `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par Supabase.

## 4. Relances planifiées (pg_cron + Vault)

Les tâches pg_cron sont créées par les migrations (relances à 9 h, push chaque minute, expiration des abonnements chaque nuit). Pour qu'elles puissent appeler les Edge Functions, ajouter deux secrets dans **Vault** (éditeur SQL, une seule fois) :

```sql
select vault.create_secret('https://<référence-du-projet>.supabase.co', 'project_url');
select vault.create_secret('<clé service_role>', 'service_role_key');
```

Vérifier ensuite : `select * from cron.job;` et, le lendemain, `select * from cron.job_run_details order by start_time desc limit 10;`.

## 5. Notifications push (EAS)

1. Créer le projet EAS : `npx eas-cli@latest init` (renseigne `extra.eas.projectId` dans `app.json`).
2. Android : ajouter les identifiants FCM (`npx eas-cli@latest credentials`, fichier `google-services.json` du projet Firebase).
3. Optionnel : `EXPO_PUBLIC_EAS_PROJECT_ID` dans `.env`.

## 6. Build interne pour les testeuses (APK)

```bash
npx eas-cli@latest build --profile preview --platform android
```
Le lien de téléchargement de l'APK peut être partagé aux 10 à 20 gérantes testeuses.

## 7. Réglages de l'app

Dans `.env` / `eas.json` :
- `EXPO_PUBLIC_NUMERO_AIDE` : numéro WhatsApp de l'aide (sans « + ») — la ligne « Aide sur WhatsApp » du profil est masquée tant qu'il est vide.
- `EXPO_PUBLIC_NUMERO_WAVE_NATT` : numéro Wave de Natt pour les abonnements (B5).

## 8. Activation manuelle des abonnements (en attendant la décision B5)

Quand une gérante a payé :
```sql
-- Trouver la demande
select a.id, p.prenom, p.telephone, a.palier, a.periodicite, a.created_at
from abonnements a join profils p on p.id = a.profil_id
where a.statut = 'en_attente' order by a.created_at;
-- L'activer (1 mois ou 1 an selon la périodicité)
select public.activer_abonnement('<id>');
```
Gérante fondatrice : `update profils set fondatrice = true where telephone = '2217…';`

## 9. Avant le lancement public

- Déclaration du traitement à la CDP (D3).
- Calendrier : vérifier les dates des fêtes dans `evenements_calendrier` (le seed contient des dates approximatives) et les insérer en production.
- Vérifier sur téléphone les liens de Wave et Orange Money (`src/lib/paiementMobile.ts`).
- Limiter les essais de code d'invitation (force brute).
