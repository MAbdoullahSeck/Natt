# Natt — Plan de développement V1

Une étape = une branche + une pull request. Ne passer à l'étape suivante que lorsque tous les critères sont cochés.

## Étape 0 — Socle du projet
- [x] Projet Expo TypeScript strict avec expo-router, ESLint, Prettier, Jest (`jest-expo`).
- [x] Police Nunito chargée, jetons du thème (`src/theme`) conformes à `design-system.md`.
- [x] `src/i18n/fr.ts` et utilitaires `formatMontant` (« 10 000 F ») et `formatDate` (français), testés.
- [x] Composants de base de `design-system.md` + une page de démonstration interne.
- [x] Commandes réelles renseignées dans `CLAUDE.md`.

## Étape 1 — Supabase
- [x] `supabase init`, migrations du schéma de `architecture.md`, RLS sur toutes les tables.
- [x] Données de démonstration (seed) : Aminata, Fatou, Moussa… et 3 tontines comme sur Figma.
- [x] Types générés dans `src/lib/database.types.ts`.
- [x] Tests SQL ou d'intégration : un membre ne voit pas une tontine dont il ne fait pas partie ; personne ne peut modifier `evenements`.

## Étape 2 — Inscription (écrans 01 à 04)
- [x] Connexion par téléphone + code SMS (fournisseur SMS configuré : **signaler si absent**). → numéros de test à code fixe, voir `docs/decisions.md`.
- [x] Prénom et consentement enregistrés (date + version). Bouton désactivé sans consentement.
- [x] Session persistante ; déconnexion depuis le Profil.

## Étape 3 — Accueil et création (05, 05b, 06 à 11, 06b)
- [x] Accueil avec cartes et statuts réels ; accueil vide.
- [x] Parcours de création en 6 étapes, type « achat groupé » avec bien prévu.
- [x] Suggestion de calendrier sur l'écran 10.
- [x] `creer_tontine` côté serveur : code unique, tours, échéances, règlement v1, limite du palier.
- [x] Partage WhatsApp du code.

## Étape 4 — Rejoindre (12, 12b, 12c)
- [x] Saisie du code, erreurs (code inconnu, tontine complète ou terminée).
- [x] Aperçu + acceptation du règlement obligatoire, puis `rejoindre_tontine`.

## Étape 5 — Vues tontine (13, 13c, 14, 16)
- [x] Vue gérante : cagnotte, bénéficiaire, compte des paiements, liste des membres et statuts (dont « En retard » calculé).
- [x] « Marquer payé » via `confirmer_paiement` ; historique horodaté d'un membre.
- [x] Vue membre : prochain paiement, statut, son tour, bien prévu si achat groupé.

## Étape 6 — Paiement (17, 18)
- [x] Ouverture de Wave / Orange Money (liens profonds vérifiés, sinon copie numéro + montant).
- [x] `declarer_paiement` au retour, capture facultative (Storage).
- [x] **Aucun portefeuille, aucun solde.**

## Étape 7 — Tours (15, 15b, 15c)
- [ ] Ordre des tours ; tirage au sort serveur (une fois par cycle) ; résultat partagé.
- [ ] Échange de tour par la gérante (tours non versés uniquement), notifications aux deux membres.
- [ ] Tests de la logique d'ordre et d'échange.

## Étape 8 — Réglages, relances, notifications (13b, 22)
- [ ] Réglages : relances J-3 / J / J+1, pénalité, règlement (nouvelle version à accepter).
- [ ] Relances planifiées (pg_cron 9 h Dakar) + relance manuelle limitée à 1 par jour et par membre.
- [ ] Pénalités appliquées et annulables. Push + écran Notifications.

## Étape 9 — Fin de cycle (19, 19b)
- [ ] Clôture automatique au dernier tour versé.
- [ ] Rapport du cycle et partage WhatsApp.
- [ ] Relancer le cycle avec les mêmes membres.

## Étape 10 — Abonnement et profil (20, 21, 23)
- [ ] Paliers mensuels et annuels, limites appliquées à la création, alerte d'upsell.
- [ ] Indicateur « gérante fondatrice ». Encaissement selon la décision B5 (en attendant : activation manuelle).
- [ ] Profil complet (abonnement, données, langue, aide, déconnexion, retrait du consentement).

## Étape 11 — Finition et test terrain
- [ ] États vides, erreurs réseau, chargements sur tous les écrans.
- [ ] Vérification sur un Android d'entrée de gamme (taille de texte système agrandie comprise).
- [ ] Build interne EAS (APK) pour 10 à 20 gérantes testeuses.
