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

- Suis `docs/plan.md` **dans l'ordre**, une étape à la fois. Ne commence pas l'étape suivante tant que les critères de validation de l'étape en cours ne sont pas remplis.
- Une étape = une branche + une pull request vers `main`, avec une description qui reprend les critères validés.
- Toute modification de schéma passe par une migration dans `supabase/migrations/`. Jamais de modification manuelle en production.
- Écris des tests pour la logique métier (calcul des statuts, ordre des tours, échange, limites d'abonnement, pénalités).
- Si une règle du cahier des charges est ambiguë ou contradictoire, **arrête-toi et pose la question** au lieu de deviner.
- Signale immédiatement tout blocage technique (dépendance, service externe, accès manquant) au lieu de contourner en silence.

## Commandes (à compléter à l'étape 0)

```bash
npm install
npx expo start            # lancer l'app
npm test                  # tests
npm run lint              # lint + typecheck
supabase start            # Supabase local
supabase db reset         # rejouer les migrations
supabase gen types typescript --local > src/lib/database.types.ts
```
