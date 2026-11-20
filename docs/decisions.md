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

## Étape 4 — Rejoindre

- **Vérification du code** : automatique au 6e chiffre (comme le code SMS). Les erreurs (code inconnu, tontine complète, terminée, déjà membre) utilisent l'écran 12b avec un message adapté.
- **Règlement modifié entre l'aperçu et la validation** : refus `reglement_change`, l'aperçu est rechargé pour relire la nouvelle version.
- **Passage en cours (T3)** : dès que la tontine est complète et que la date de début est atteinte (`demarrer_tontines`, appelée à chaque arrivée et chaque jour par pg_cron).
- **Mode d'attribution affiché** : « Tirage au sort » si un tirage a eu lieu, sinon « Ordre d'arrivée ».
- **Lien profond** `natt://rejoindre?code=…` : code prérempli et vérifié automatiquement (si la personne est connectée).
- **Textes des notifications** : rédigés côté serveur (SQL) en français, car ils sont aussi envoyés en push. À déplacer dans des modèles traduisibles quand le wolof arrivera.
- **Non fait** : limitation des essais de code (force brute sur 1 million de codes). À prévoir avant le lancement public (ex. 10 essais par heure et par compte).

## Étape 5 — Vues tontine

- **Une seule route** `tontine/[id]` : vue gérante (13) si l'utilisatrice est la gérante, vue membre (16) sinon. La gérante voit aussi son propre statut dans la liste des membres (« Aminata (Toi) »).
- **Remise de la cagnotte** : pas d'écran dans le cahier des charges, mais nécessaire pour passer au tour suivant et clore le cycle (F1). Quand tous les membres ont payé le tour en cours, l'action principale de l'écran 13 devient « Cagnotte remise à [prénom] » (« Bien remis à… » pour un achat groupé) → `marquer_verse`. Les tours se remettent dans l'ordre. La gérante peut remettre une cagnotte même si un paiement manque, mais le bouton n'apparaît que quand tout est payé.
- **« Marquer payé » sans déclaration** : autorisé (paiement en espèces, par exemple) ; l'événement de confirmation le note (`sans_declaration`).
- **Code d'invitation** : rappelé sur l'écran 13 tant qu'il reste des places, avec « Partager le code ».
- **Bilan 13c** : « à l'heure » / « en retard » selon la règle de pénalité P5 (date de déclaration), en ne comptant que les tours échus ou réglés.
- **Prochain paiement (16)** : la plus ancienne cotisation non payée du membre. Le bouton « Payer » n'apparaît que si elle est « à payer » (pas si elle est déjà déclarée).
- **Nouveaux types d'événements** : `versement` (cagnotte remise) et `reglement_modifie` (étape 8).
