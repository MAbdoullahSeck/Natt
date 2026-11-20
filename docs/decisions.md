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

## Étape 6 — Paiement

- **Wave / Orange Money** : aucun lien profond public pour un transfert entre particuliers avec numéro et montant préremplis n'a été trouvé. Tout est isolé dans `src/lib/paiementMobile.ts` :
  1. le numéro de la gérante est copié dans le presse-papiers ;
  2. on essaie d'ouvrir l'application (`wave://`, `orangemoney://` : **schémas non confirmés, à tester sur téléphone**) ;
  3. sinon : Orange Money → composeur avec `#144#` ; Wave → page de l'application dans le Play Store / App Store.
  Le montant est affiché en gros sur l'écran 17 (il ne peut pas être prérempli).
- **Retour de l'application de paiement** : détecté quand l'app Natt revient au premier plan ; la cotisation passe alors en « déclaré » et l'écran 18 s'affiche (P2). Un lien « J'ai déjà payé » permet aussi de déclarer sans passer par l'application (paiement fait avant, ou application non détectée).
- **Choix de l'application** : Wave présélectionné. Composant « Moyen de paiement » (Figma 6:537) non lu : options avec icône téléphone.
- **Captures** : bucket privé `captures`, chemin `{tontine}/{cotisation}/{horodatage}.jpg`, 5 Mo maximum (JPEG, PNG, WebP). Le membre dépose, la gérante et le membre lisent (lien signé de 10 minutes). La capture s'affiche sur l'écran 14 « Marquer payé ».
- **Gérante qui paie sa propre part** : elle déclare comme les autres membres et confirme elle-même.

## Étape 7 — Tours

- **Tirage au sort** : possible une seule fois par cycle, **quand tous les membres ont rejoint** et **avant toute remise de cagnotte** (sinon des membres arrivés plus tard ou déjà servis fausseraient le tirage).
- **Algorithme** : Fisher–Yates alimenté par un flux HMAC-SHA256 d'une graine aléatoire de 32 octets (`supabase/functions/_shared/melange.ts`). La graine, l'ordre et l'algorithme sont enregistrés dans l'événement `tirage` : le tirage est vérifiable (même graine → même ordre).
- **Edge Functions sans dépendance** : elles appellent directement Auth et PostgREST avec `fetch` (`_shared/api.ts`), au lieu d'importer `supabase-js` (impossible à télécharger dans l'environnement local, et plus léger en production).
- **Vérifications du tirage en SQL** (`appliquer_tirage`, réservée à `service_role`) : gérante, une fois par cycle, tontine complète, ordre = permutation exacte des membres.
- **« Vu par N membres »** : table `vues_tirage` ; une personne est comptée quand elle ouvre l'écran 15c (la gérante est comptée d'office).
- **Écran 15c** : montre l'ordre tel qu'il a été tiré, même si des échanges ont eu lieu ensuite. L'écran 15 montre l'ordre actuel.
- **Dates des tours** : « Janv. 2027 » pour une tontine mensuelle, « 5 décembre » pour une tontine quotidienne ou hebdomadaire.
- **Échange (15b)** : on part du membre appuyé longuement (tour à déplacer), puis on choisit l'autre membre parmi les tours non versés. Les deux membres sont notifiés (sauf la gérante si elle est l'une des deux).
- **Les membres** voient aussi l'ordre des tours (lien « Ordre des tours » sur l'écran 16), sans pouvoir le modifier.

## Étape 8 — Réglages, relances, notifications

- **Relances automatiques** : seulement aux membres dont la cotisation est « à payer » (pas à ceux qui ont déjà déclaré leur paiement), jamais à la gérante. J-3, J et J+1 selon les réglages ; une seule relance par moment et par tour (idempotent).
- **Calcul en SQL, déclenché par une Edge Function** : pg_cron appelle chaque jour à 9 h UTC (= 9 h à Dakar, pas d'heure d'été) l'Edge Function `relances`, qui exécute `preparer_relances()` puis envoie les push. pg_cron appelle aussi `push` chaque minute pour les notifications immédiates (confirmation, échange…). Les appels HTTP lisent l'URL du projet et la clé service dans **Vault** (`project_url`, `service_role_key`) ; sans ces secrets, rien n'est appelé (cas du développement local).
- **Récapitulatif J+1 à la gérante (A3)** : une notification par tontine et par jour, avec les prénoms des retardataires.
- **Relance manuelle (A4)** : « Relancer les retardataires » vise les membres qui n'ont rien déclaré alors que l'échéance est passée ; « Relancer [prénom] » vise un membre dont la cotisation est à payer (même avant l'échéance). Au plus une relance manuelle par membre et par jour (heure de Dakar).
- **Pénalités (P5)** : calculées chaque matin pour les tours échus ; une par membre et par tour, seulement si la déclaration est faite après l'échéance (ou s'il n'y a rien de déclaré). Affichées au membre (total à régler à la gérante, en dehors de Natt) et à la gérante (écran 13c, avec « Annuler »). La gérante n'a jamais de pénalité.
- **Règlement versionné (R2)** : changer la pénalité ou les règles libres crée une nouvelle version. La gérante l'accepte d'office ; chaque membre doit l'accepter à sa prochaine ouverture de la tontine (écran intermédiaire). Les rappels J-3 / J / J+1 ne changent pas le règlement.
- **Règles libres** : 10 au plus, 200 caractères chacune, ajoutées après les lignes générées.
- **Écran Notifications (22)** : les 100 dernières, par jour (« Aujourd'hui », « Hier », date) ; tout est marqué comme lu à l'ouverture de l'onglet. Appui → la tontine concernée.
- **Push** : jeton Expo enregistré à la connexion (téléphone réel uniquement, il faut un `projectId` EAS : variable `EXPO_PUBLIC_EAS_PROJECT_ID`). Canal Android « natt ». L'appui sur une notification push ouvre la tontine.

## Étape 9 — Fin de cycle

- **Clôture** : au moment où la gérante remet la dernière cagnotte (`marquer_verse`), la tontine passe en « terminée », un événement `cycle_termine` est enregistré, les membres sont notifiés et la gérante arrive sur l'écran 19.
- **Rapport (19b)** : calculé dans l'app (`src/domain/rapport.ts`) à partir des cotisations et des événements : total versé, nombre de tours, période (premier et dernier tour), % de paiements à l'heure (règle P5), nombre de retards, pénalités non annulées, ponctualité par membre.
- **Partage du rapport** : en **texte** sur WhatsApp (pas d'image ni de PDF en V1 : cela demanderait une bibliothèque de capture ou de génération de PDF ; à ajouter si besoin).
- **Relancer le cycle (F3)** : la gérante choisit la date de début (pas de suggestion de calendrier sur cet écran pour l'instant), puis `relancer_cycle` crée une nouvelle tontine avec les mêmes paramètres et réglages (pénalité, rappels, règles libres), un nouveau code, `cycle_precedent_id`, la gérante au rang 1. La limite du palier s'applique. Les anciens membres reçoivent une notification avec le nouveau code ; un appui ouvre l'écran Rejoindre avec le code prérempli, pour reconfirmer participation et règlement. Le nouvel ordre suit l'ordre d'arrivée ; un tirage reste possible.
- **Notifications** : nouvelle colonne `donnees` (ex. le code du nouveau cycle).

## Étape 10 — Abonnement et profil

- **Écrans 20 et 21 regroupés** : un seul écran avec un choix « Mensuel / Annuel (2 mois offerts) » en haut ; les prix changent selon le choix. Le palier actuel est marqué « ✓ Ton abonnement actuel », la demande en cours « En attente de paiement ».
- **Upsell (B3)** : arrivée depuis la création (ou la relance d'un cycle) quand la limite est atteinte → message d'explication et palier supérieur présélectionné.
- **Encaissement (B5, décision en attente)** : « Choisir » crée un abonnement `en_attente` (une seule demande à la fois). L'écran indique d'envoyer le montant par Wave au numéro de Natt (`EXPO_PUBLIC_NUMERO_WAVE_NATT`, **à renseigner**). L'équipe active ensuite à la main : `select public.activer_abonnement('<id de l'abonnement>');` dans l'éditeur SQL Supabase (rôle service). L'activation prolonge à partir de la fin de l'abonnement actif et prévient la gérante. Un job pg_cron passe chaque nuit en « expiré » les abonnements échus.
- **Gérante fondatrice (B4)** : indicateur `profils.fondatrice` (à cocher à la main en base) : badge « Gérante fondatrice » sur le profil, mention « prix bloqué » sur l'écran abonnement, limite Starter même sans abonnement. Le prix bloqué lui-même n'est pas encore géré (il dépendra de la décision B5).
- **Profil (23)** : prénom, numéro, badge fondatrice, Mon abonnement (palier + prix), Mes données, Langue (Français seulement, pas d'interaction tant que le wolof n'existe pas), Aide sur WhatsApp (**masquée tant que `EXPO_PUBLIC_NUMERO_AIDE` n'est pas renseigné**), Se déconnecter.
- **Retrait du consentement (D2)** : écran de confirmation avec case à cocher. Le profil devient « Ancien membre », le numéro est effacé (profil et compte Auth), le compte est bloqué, les notifications sont supprimées, l'historique des tontines est conservé. Les tontines dont la personne est gérante continuent d'exister (à traiter : transfert à une autre gérante ?).

## Étape 11 — Finition

- **États de chargement et d'erreur** : chaque écran qui charge des données affiche un indicateur, puis un message (« Pas de connexion. Vérifie ton internet. ») avec « Réessayer ». Les états vides ont un texte (accueil, notifications, historique).
- **Taille de texte système** : respectée jusqu'à 1,5 fois (`maxFontSizeMultiplier`) pour que les écrans restent utilisables. **Non vérifié sur téléphone.**
- **Démonstration des composants** (`/demo`) : accessible seulement en développement.
- **Permissions Android** : galerie (capture de paiement) avec un texte en français ; caméra et micro désactivés ; canal de notifications « natt » en terracotta.
- **Build EAS** : `eas.json` prêt (profil `preview` = APK interne). Le build demande un compte EAS : non lancé.
- **Tests de bout en bout** : `npm run e2e` rejoue 12 parcours sur l'export web contre la base locale (inscription, création, rejoindre, paiement, confirmation, tours, tirage, échange, réglages, nouveau règlement, notifications, fin de cycle, abonnement, profil). Ils demandent Playwright et la stack locale.

## Ce qui reste cassé ou non vérifié

- **Rien d'échoue** dans les tests automatiques au moment du dernier commit : Jest, lint + typecheck, pgTAP et e2e passent.
- **Non vérifié** : comportement sur un vrai téléphone Android (performances, sélecteur de date natif, ouverture de Wave / Orange Money et retour dans l'app, notifications push réelles, taille de texte agrandie). Les tests e2e tournent sur la version web.
- **Edge Functions** : testées en local (`tirage-au-sort` de bout en bout, `push` et `relances` par appel direct), pas déployées.
- **pg_cron** : les tâches sont créées, mais leurs appels HTTP sont ignorés tant que les secrets Vault ne sont pas renseignés (production).
- **Notification push « nouveau cycle »** : corrigé à l'étape 11 (le push transporte le code ; un appui ouvre « Rejoindre » avec le code prérempli).
- **Écrans non comparés au Figma** (accès MCP bloqué) : textes, mises en page et composants « Offre d'abonnement », « Moyen de paiement », « Notification », « Membre · Statut et validation » à vérifier.

## Base en ligne natt-dev (après l'étape 11)

- **Projet** : `natt-dev` (réf. `vzvtuthjxyjaitesnvih`, eu-west-1) remplace Docker pour le développement courant. La stack locale reste utilisée par les tests e2e, qui réinitialisent la base.
- **Migrations appliquées par l'API de gestion** : la session cloud ne peut pas joindre Postgres directement (seulement HTTPS), donc `supabase db push` y est impossible. `scripts/supabase_api.py` applique les migrations par l'endpoint SQL de l'API et les enregistre dans `supabase_migrations.schema_migrations` : un `supabase db push` lancé ensuite depuis un poste les voit comme déjà appliquées.
- **RLS activée par défaut** (`ensure_rls`) : compatible, car chaque migration active déjà la RLS et crée ses politiques. Vérifié : 11 tables sur 11 avec RLS, 167 tests pgTAP passés sur le projet en ligne.
- **Connexion de test** : fournisseur Twilio factice + 20 numéros de test à code fixe, configurés par l'API de gestion. Durée de validité du code SMS portée à 5 minutes (60 s par défaut).
- **Client** : plus de repli silencieux vers la base locale ; sans `.env`, l'app s'arrête avec un message clair.
- **Edge Functions déployées** sur natt-dev (regroupement côté serveur, `--use-api`), avec `verify_jwt = false` : le projet signe les jetons en ES256 (clés asymétriques), et chaque fonction vérifie déjà son appelant.
- **Appels système** (`push`, `relances`) : la clé reçue est vérifiée par la base (appel à une fonction réservée à `service_role`) au lieu d'être comparée à `SUPABASE_SERVICE_ROLE_KEY` : sur natt-dev, la clé « legacy » stockée dans Vault et la clé fournie aux fonctions n'ont pas le même format.
- **Vault** : `project_url` et `service_role_key` (clé service « legacy ») renseignés. Vérifié : `natt-push` réussit chaque minute (HTTP 200), `relances` répond via Vault, la clé publique est refusée.
