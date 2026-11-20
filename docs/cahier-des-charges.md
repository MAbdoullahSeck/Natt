# Natt — Cahier des charges V1

Version : 20 novembre 2026. Le design Figma fait foi pour l'apparence ; ce document fait foi pour le comportement.

---

# Partie 1 — Les écrans

Les identifiants entre crochets sont les nœuds Figma (fichier `dVf0o3jlgmFcFAtzi3IaBC`).

## 1.1 Inscription

| # | Écran | Nœud | Comportement |
|---|---|---|---|
| 01 | Inscription · Téléphone | `2:67` | Saisie du numéro sénégalais (+221, 9 chiffres) au pavé numérique. Bouton « Recevoir le code » actif seulement si le numéro est valide. |
| 02 | Inscription · Code SMS | `2:74` | 6 cases, pavé numérique, vérification automatique au 6e chiffre. Lien « Renvoyer le code » après 60 s. |
| 03 | Inscription · Prénom | `2:81` | Prénom obligatoire (2 à 30 caractères). « Visible dans tes tontines ». |
| 04 | Inscription · Consentement | `2:88` | Case non cochée par défaut. « Créer mon compte » désactivé tant que la case n'est pas cochée. Enregistre la date et la version du consentement. Lien « Mes droits ». |

## 1.2 Accueil

| # | Écran | Nœud | Comportement |
|---|---|---|---|
| 05 | Accueil | `2:95` | Liste des tontines (gérées et rejointes) : nom, montant, statut de l'utilisatrice pour le tour en cours, « gérante · nb membres · fréquence ». Boutons « Créer une tontine » et « Rejoindre avec un code ». Navigation du bas : Accueil, Notifications, Profil. |
| 05b | Accueil · Vide | `13:622` | Affiché quand l'utilisatrice n'a aucune tontine. |

## 1.3 Créer une tontine (6 étapes, une question par écran)

| # | Écran | Nœud | Comportement |
|---|---|---|---|
| 06 | Créer · Nom (1/6) | `2:102` | Nom de la tontine, 2 à 40 caractères. |
| 06b | Créer · Type (2/6) | `12:398` | « Classique » (chacun reçoit la cagnotte) ou « Achat groupé » (chacun reçoit un bien). Si achat groupé : champ obligatoire « Quel bien chacun reçoit ? » (ex. Réfrigérateur). |
| 07 | Créer · Montant (3/6) | `2:109` | Montant par membre et par tour, en FCFA, pavé numérique. Minimum 500 F. |
| 08 | Créer · Fréquence (4/6) | `2:116` | Jour, Semaine ou Mois. |
| 09 | Créer · Membres (5/6) | `2:123` | Nombre de membres, gérante comprise (2 à 50). Détermine le nombre de tours. |
| 10 | Créer · Date (6/6) | `2:130` | Date du premier tour (aujourd'hui ou plus tard). **Suggestion de calendrier** : si un événement (Tabaski, Korité, rentrée scolaire…) tombe pendant le cycle, une carte propose « Ajuster » pour caler un tour juste avant. La gérante décide ; rien n'est automatique. Bouton « Créer la tontine ». Vérifie la limite du palier d'abonnement avant création. |
| 11 | Tontine créée | `2:137` | Code d'invitation à 6 chiffres, récapitulatif, bouton « Partager sur WhatsApp » (message prérempli avec le code et un lien). |

## 1.4 Rejoindre

| # | Écran | Nœud | Comportement |
|---|---|---|---|
| 12 | Rejoindre | `2:144` | Saisie du code à 6 chiffres au pavé numérique. |
| 12b | Rejoindre · Code invalide | `12:469` | Cases en terracotta + « Ce code n'existe pas. Vérifie-le avec ta gérante. » Aussi utilisé si la tontine est complète ou terminée (message adapté). |
| 12c | Rejoindre · Règlement | `12:513` | Aperçu (montant, fréquence, nb membres, gérante, mode d'attribution des tours) + règlement de la tontine. Case « J'accepte le règlement » obligatoire avant « Rejoindre la tontine ». |

## 1.5 Vue gérante

| # | Écran | Nœud | Comportement |
|---|---|---|---|
| 13 | Tontine · Gérante | `6:240` | Cagnotte du tour, bénéficiaire du tour, « X F reçus · N sur M payés ». Accès « Tours » et « Réglages ». Liste des membres avec statut ; bouton « Marquer payé » sur les membres non payés. Appui sur un membre → historique (13c). Bouton « Relancer les retardataires ». **L'abonnement n'apparaît pas ici** (il est dans le Profil). |
| 13b | Tontine · Réglages | `12:565` | Rappels automatiques (3 jours avant, jour même, 1 jour après) activables un par un. Montant de la pénalité de retard (0 = aucune). Accès au règlement (voir / modifier). |
| 13c | Membre · Historique | `12:661` | Bilan (« 6 à l'heure », « 1 en retard ») + liste horodatée de tous les paiements avec statut et capture jointe. Bouton « Relancer [prénom] ». |
| 14 | Membre · Marquer payé | `6:247` | « As-tu reçu ce paiement ? Vérifie sur Wave ou Orange Money. » Bouton « Marquer payé ». |
| 15 | Ordre des tours | `6:254` | Liste numérotée tour → membre → mois. Bouton « Tirage au sort » (si pas encore fait). Appui long sur un membre → échange de tour (15b). |
| 15b | Tours · Échanger | `12:762` | Tour à déplacer + liste des autres membres (tours non encore versés uniquement). Bouton « Échanger les tours ». Les deux membres sont notifiés. |
| 15c | Tirage au sort · Résultat | `12:828` | Ordre tiré, date et heure, « vu par N membres ». Bouton « Envoyer au groupe ». |

## 1.6 Vue membre et paiement

| # | Écran | Nœud | Comportement |
|---|---|---|---|
| 16 | Tontine · Membre | `6:261` | « Prochain paiement : montant + date », statut, « Ton tour : mois », gérante et son numéro. Bouton « Payer ». Pour un achat groupé, afficher le bien prévu. |
| 17 | Paiement · Choisir | `6:268` | Montant, bénéficiaire (gérante + numéro). Choix Wave ou Orange Money. « Directement à [gérante]. Natt ne garde pas l'argent. » |
| 18 | Paiement envoyé | `6:275` | Écran de confirmation après le retour de l'application de paiement (voir règle P2). Bouton « Terminer ». |

## 1.7 Fin de cycle, abonnement, profil, notifications

| # | Écran | Nœud | Comportement |
|---|---|---|---|
| 19 | Fin de cycle | `6:282` | Bilan du cycle. Bouton secondaire « Voir le rapport du cycle ». Bouton principal « Relancer le cycle avec les mêmes membres ». |
| 19b | Rapport du cycle | `13:455` | Total versé, nb de tours, période, % de paiements à l'heure, nb de retards, total des pénalités, ponctualité par membre. « Partager sur WhatsApp » (image ou PDF). |
| 20 | Abonnement · Mensuel | `6:289` | Paliers Starter / Pro / Illimité, palier actuel coché. |
| 21 | Abonnement · Annuel | `6:296` | Même écran en annuel, mention « 2 mois offerts ». |
| 22 | Notifications | `6:303` | Liste par jour : rappels de paiement, paiements reçus, tours à venir, échanges, tirage. |
| 23 | Profil | `13:523` | Prénom, numéro. Mon abonnement (palier + prix → écrans 20/21), Mes données, Langue, Aide sur WhatsApp, Se déconnecter. |

---

# Partie 2 — Fonctionnalités V1 et règles métier

## 2.1 Rôles

- **Gérante** : crée la tontine, en est administratrice, est aussi membre (elle cotise et a un tour).
- **Membre** : rejoint par code, cotise, reçoit sa cagnotte à son tour.
- Une même personne peut être gérante de certaines tontines et membre d'autres.

## 2.2 Tontine

- T1. Types : `classique` ou `achat_groupe`. Pour un achat groupé, `bien_prevu` est obligatoire et affiché partout où la tontine est présentée.
- T2. Une tontine a un nombre de membres fixe N, donc N tours. Cagnotte d'un tour = montant × N.
- T3. Statuts de tontine : `en_preparation` (membres en cours d'inscription) → `en_cours` (premier tour démarré) → `terminee`.
- T4. Le code d'invitation est composé de 6 chiffres, unique parmi les tontines non terminées. Il ne permet plus de rejoindre une fois la tontine complète.
- T5. Les échéances sont calculées depuis la date de début et la fréquence (jour, semaine, mois). L'échéance d'un tour est la date à laquelle chaque membre doit avoir payé.

## 2.3 Règlement numérique

- R1. Chaque tontine a un règlement généré à partir de ses paramètres (date limite de paiement, pénalité, qui fixe l'ordre des tours) ; la gérante peut ajouter des lignes libres.
- R2. Le règlement est versionné. Un membre accepte une version précise (date et heure enregistrées). Si la gérante modifie le règlement, les membres doivent accepter la nouvelle version à leur prochaine ouverture de la tontine.

## 2.4 Paiements et statuts

- P1. Statut d'un membre pour un tour : `a_payer` → (`declare`) → `paye`. L'échéance est le dernier jour pour payer : une déclaration faite le jour de l'échéance est à l'heure.
  - `paye` : « Payé ».
  - `declare` **avant ou le jour de l'échéance** : « En attente », même une fois l'échéance passée (en attendant la confirmation de la gérante).
  - `declare` après l'échéance, ou `a_payer` une fois l'échéance passée : « En retard ».
  - `a_payer` avant l'échéance : « En attente ».
- P2. Quand un membre appuie sur « Payer », l'app ouvre Wave ou Orange Money avec le numéro de la gérante (et le montant si l'application le permet ; à vérifier, sinon copie du numéro et du montant). Au retour, l'écran 18 s'affiche et la cotisation passe en `declare`. Le membre peut joindre une capture (facultatif).
- P3. **Seule la gérante peut passer un paiement en `paye`** (écran 14). Côté gérante, un paiement `declare` s'affiche « En attente » avec le bouton « Marquer payé » mis en avant.
- P4. **Historique horodaté** : chaque événement (déclaration, confirmation, relance, pénalité, annulation) est enregistré dans une table d'événements en ajout seul (aucune modification ni suppression possible). L'historique d'un membre (13c) se construit à partir de ces événements.
- P5. Pénalité de retard : si un montant est défini, une pénalité est enregistrée pour chaque tour en retard, c'est-à-dire **uniquement si la déclaration est faite après l'échéance** (ou s'il n'y a toujours pas de déclaration une fois l'échéance passée). Une déclaration faite à temps n'est jamais pénalisée, même si la gérante la confirme plus tard. Elle est affichée au membre et à la gérante. La gérante peut l'annuler (événement enregistré).

## 2.5 Ordre des tours

- O1. Trois façons de fixer l'ordre : manuelle (par défaut, ordre d'arrivée modifiable), tirage au sort, ou échange ponctuel.
- O2. **Tirage au sort** : exécuté côté serveur (Edge Function), une seule fois par cycle, enregistré avec la date, l'heure et l'algorithme ; résultat visible par tous les membres et non modifiable par tirage. Les échanges restent possibles ensuite.
- O3. **Échange de tour** : réservé à la gérante. Seuls des tours non encore versés peuvent être échangés. Les deux membres concernés sont notifiés. L'échange est enregistré dans l'historique.

## 2.6 Relances automatiques

- A1. Trois relances paramétrables par tontine : J-3, jour J, J+1 (retard). Toutes activées par défaut.
- A2. Envoi par notification push à 9 h (heure de Dakar), uniquement aux membres dont le statut n'est pas `paye`.
- A3. Le jour J+1, la gérante reçoit aussi une notification récapitulant les retards.
- A4. Le bouton « Relancer les retardataires » / « Relancer [prénom] » envoie une relance immédiate (au maximum une par membre et par jour).

## 2.7 Calendrier intelligent

- C1. Table d'événements (Tabaski, Korité, Ramadan, rentrée scolaire, Magal…) avec leurs dates par année, maintenue en base.
- C2. À la création (écran 10) et à la relance d'un cycle, si un événement tombe pendant le cycle, une suggestion est affichée. « Ajuster » propose de déplacer la date de début pour qu'un tour tombe juste avant l'événement. Rien n'est appliqué sans action de la gérante.

## 2.8 Fin de cycle

- F1. Quand le dernier tour est payé et versé, la tontine passe en `terminee` et l'écran 19 s'affiche pour la gérante.
- F2. **Rapport de fin de cycle** (19b) calculé à partir des événements, partageable sur WhatsApp.
- F3. **Relancer le cycle** : crée une nouvelle tontine avec les mêmes paramètres et les mêmes membres (chacun doit reconfirmer sa participation et le règlement), un nouveau code, et propose un nouvel ordre des tours.

## 2.9 Abonnement de la gérante

- B1. Paliers : Starter 1 000 F/mois (1 à 2 tontines gérées en cours), Pro 2 500 F/mois (jusqu'à 6), Illimité 5 000 F/mois. Annuel : 10 000 / 25 000 / 50 000 F (« 2 mois offerts »).
- B2. Seules les tontines **gérées** et non terminées comptent dans la limite. Rejoindre une tontine est toujours gratuit.
- B3. Si la limite est atteinte, la création (écran 10) mène aux écrans 20/21 avec le palier supérieur présélectionné (alerte d'upsell).
- B4. Programme « gérantes fondatrices » : un indicateur par compte permet d'offrir une période gratuite et un prix bloqué.
- B5. Encaissement des abonnements en V1 : **décision en attente** (lien de paiement Wave Business / agrégateur, ou activation manuelle après paiement Wave). Prévoir une table d'abonnements avec statut et date d'expiration, activable manuellement depuis le tableau de bord Supabase en attendant.

## 2.10 Données personnelles

- D1. Consentement explicite à l'inscription (case non pré-cochée), avec date et version enregistrées.
- D2. Retrait du consentement possible depuis Profil → Mes données (désactive le compte et anonymise les données personnelles, en conservant l'historique financier anonymisé des tontines).
- D3. Traitement à déclarer auprès de la CDP (Commission de Protection des Données Personnelles du Sénégal) avant le lancement public.

## 2.11 Hors périmètre V1 (ne pas développer)

Portefeuille ou solde, encaissement des cotisations par Natt, score de fiabilité, Natt sur WhatsApp (bot), USSD/SMS, interface vocale, place de marché des tontines, négociation avec des fournisseurs, tontines à enchères ou accumulatives, diaspora, micro-crédit, assurance, application web.
