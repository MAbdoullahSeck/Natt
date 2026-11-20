# Natt — Journal des décisions

Choix faits pendant le développement quand le cahier des charges, l'architecture ou le Figma ne tranchaient pas.
Chaque ligne indique l'étape, la décision et où la changer si besoin.

## Contexte général

- **Figma inaccessible** : le serveur MCP Figma a atteint la limite du forfait Starter dès l'étape 0. Seuls les composants Bouton principal, Bouton secondaire, Clavier numérique et Navigation ont été lus. Tous les écrans et leurs textes ont été écrits d'après le cahier des charges : **à comparer au Figma**.
- **Marathon des étapes 2 à 11** : réalisées d'une traite à la demande de la propriétaire du projet, sans validation intermédiaire.

## Étape 2 — Inscription

- **SMS** : pas de fournisseur. En local, `supabase/config.toml` active un fournisseur Twilio factice et 20 numéros de test à code fixe `123456` : `221770000001` à `221770000020` (les 9 premiers sont les personnes du seed). Aucun SMS n'est envoyé.
- **Numéro valide** : 9 chiffres commençant par 7 (mobiles sénégalais). Règle dans `src/domain/telephone.ts`.
- **Création du profil** : par la fonction `creer_profil(prenom, version)` plutôt que par un insert direct, pour que le téléphone vienne toujours du compte Auth et que la date du consentement soit celle du serveur.
- **Version du consentement** : `v1`, constante dans `src/domain/consentement.ts`.
- **Textes des écrans 01 à 04 et de « Mes droits »** : rédigés d'après le cahier des charges (Figma inaccessible).
- **Après le code SMS** : si le profil existe déjà (reconnexion), on va directement à l'accueil, sinon à l'écran Prénom.

## Étape 3 — Accueil et création

- **Tour en cours** : le premier tour dont la cagnotte n'a pas encore été remise (`verse_at` vide). Le statut affiché sur la carte d'accueil est celui de l'utilisatrice pour ce tour.
- **Ligne de détail des cartes** : « prénom de la gérante · N membres · Chaque mois » ; « Toi » quand l'utilisatrice est la gérante.
- **Tontines terminées** : restent sur l'accueil de la gérante (statut « Payé ») tant qu'elle n'a pas relancé le cycle ; elles disparaissent de l'accueil des membres.
- **Sans abonnement actif** : limite de 0 tontine gérée (la création mène à l'écran Abonnement, Starter présélectionné). Exception : une gérante fondatrice sans abonnement a la limite Starter (B4). Règle dans `limite_tontines` (SQL) et `src/domain/abonnement.ts`. Rejoindre reste toujours gratuit.
- **Cotisations** : créées pour tous les tours dès qu'un membre rejoint (la gérante à la création).
- **Règlement v1** : 5 lignes générées (montant et fréquence, échéance, pénalité, ce que chacun reçoit, ordre des tours) ; lignes libres ajoutées dans les réglages (étape 8).
- **Échéances mensuelles** : ramenées au dernier jour du mois (31 janvier → 28 février), comme Postgres.
- **Date du premier tour** : sélecteur natif du téléphone (`@react-native-community/datetimepicker`) ; aujourd'hui par défaut.
- **Suggestion de calendrier** : le serveur renvoie les événements du cycle (`suggestions_calendrier`), l'app calcule la date ajustée (`src/domain/calendrier.ts`) : on décale le début (jamais en arrière) pour que le dernier tour avant l'événement tombe la veille. Pas de suggestion pour les tontines quotidiennes.
- **Partage WhatsApp** : ouvre `whatsapp://send?text=…`, sinon la feuille de partage du téléphone. Le lien du message est `natt://rejoindre?code=XXXXXX` (ouvre l'app si elle est installée).
- **Textes des écrans 05 à 11** : rédigés d'après le cahier des charges (Figma inaccessible).
