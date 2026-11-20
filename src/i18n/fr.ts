/**
 * Tous les textes de l'application (CLAUDE.md : jamais de texte en dur dans un composant).
 * Le wolof viendra plus tard sous la forme d'un fichier `wo.ts` de même forme.
 */
export const fr = {
  commun: {
    continuer: 'Continuer',
    retour: 'Retour',
    effacer: 'Effacer',
    fermer: 'Fermer',
  },
  statuts: {
    paye: 'Payé',
    enAttente: 'En attente',
    enRetard: 'En retard',
  },
  navigation: {
    accueil: 'Accueil',
    notifications: 'Notifications',
    profil: 'Profil',
  },
  frequences: {
    jour: 'Chaque jour',
    semaine: 'Chaque semaine',
    mois: 'Chaque mois',
  },
  accueil: {
    titre: 'Mes tontines',
    creerTontine: 'Créer une tontine',
    rejoindreAvecCode: 'Rejoindre avec un code',
    membres: (n: number) => (n > 1 ? `${n} membres` : `${n} membre`),
    details: (gerante: string, membres: string, frequence: string) =>
      `${gerante} · ${membres} · ${frequence}`,
    toi: 'Toi',
    vide: {
      titre: 'Pas encore de tontine',
      texte: 'Crée ta tontine ou rejoins celle d’une amie avec son code.',
    },
  },
  creation: {
    filAriane: 'Créer une tontine',
    nom: {
      titre: 'Comment s’appelle ta tontine ?',
      placeholder: 'Ex. Tontine des sœurs',
      aide: 'Entre 2 et 40 lettres.',
    },
    type: {
      titre: 'Quel type de tontine ?',
      classique: 'Classique',
      classiqueDetail: 'Chacun reçoit la cagnotte',
      achat: 'Achat groupé',
      achatDetail: 'Chacun reçoit un bien',
      bienQuestion: 'Quel bien chacun reçoit ?',
      bienPlaceholder: 'Ex. Réfrigérateur',
    },
    montant: {
      titre: 'Combien chaque membre paie ?',
      aide: 'Par membre et par tour.',
      minimum: (min: string) => `Minimum ${min}.`,
    },
    frequence: {
      titre: 'Tous les combien ?',
    },
    membres: {
      titre: 'Combien de membres ?',
      aide: 'Toi comprise. Un tour par membre.',
      bornes: 'Entre 2 et 50 membres.',
      tours: (n: number) => (n > 1 ? `${n} tours` : `${n} tour`),
      cagnotte: (montant: string) => `Cagnotte de chaque tour : ${montant}`,
    },
    date: {
      titre: 'Quand commence le premier tour ?',
      changer: 'Changer la date',
      dernierTour: (date: string) => `Dernier tour : ${date}`,
      suggestion: (evenement: string, date: string) =>
        `${evenement} tombe pendant ta tontine (${date}). Tu peux décaler le début pour qu’un tour tombe juste avant.`,
      ajuster: 'Ajuster',
      ajuste: (date: string) => `Début décalé au ${date}.`,
      bouton: 'Créer la tontine',
    },
    cree: {
      titre: 'Ta tontine est créée',
      codeAide: 'Donne ce code aux membres pour qu’elles rejoignent ta tontine.',
      partager: 'Partager sur WhatsApp',
      voir: 'Voir ma tontine',
      recapMontant: (montant: string, frequence: string) => `${montant} · ${frequence}`,
      recapMembres: (n: number) => `${n} membres`,
      recapDebut: (date: string) => `Premier tour : ${date}`,
      message: (nom: string, code: string, lien: string) =>
        `Rejoins ma tontine « ${nom} » sur Natt avec le code ${code}.\n${lien}`,
    },
  },
  membre: {
    marquerPaye: 'Marquer payé',
  },
  tours: {
    tour: (n: number) => `Tour ${n}`,
    verse: 'Versé',
  },
  etapes: {
    progression: (etape: number, total: number) => `Étape ${etape} sur ${total}`,
  },
  clavier: {
    chiffre: (c: string) => `Chiffre ${c}`,
  },
  code: {
    saisi: (n: number, total: number) => `${n} chiffres sur ${total}`,
  },
  paiement: {
    directement: (gerante: string) => `Directement à ${gerante}. Natt ne garde pas l’argent.`,
  },
  erreurs: {
    reseau: 'Pas de connexion. Vérifie ton internet.',
    inconnue: 'Un problème est survenu. Réessaie.',
    reessayer: 'Réessayer',
    codes: {
      non_connecte: 'Reconnecte-toi pour continuer.',
      prenom_invalide: 'Le prénom doit faire entre 2 et 30 lettres.',
      nom_invalide: 'Le nom doit faire entre 2 et 40 lettres.',
      bien_prevu_requis: 'Indique le bien que chacun reçoit.',
      montant_invalide: 'Le montant minimum est de 500 F.',
      nb_membres_invalide: 'Entre 2 et 50 membres.',
      date_passee: 'Choisis aujourd’hui ou une date plus tard.',
      limite_atteinte: 'Tu as atteint le nombre de tontines de ton abonnement.',
    } as Record<string, string>,
  },
  inscription: {
    telephone: {
      titre: 'Ton numéro de téléphone',
      aide: 'Tu vas recevoir un code par SMS.',
      prefixe: '+221',
      bouton: 'Recevoir le code',
      invalide: 'Ce numéro n’est pas valide.',
    },
    code: {
      titre: 'Le code reçu par SMS',
      aide: (telephone: string) => `Envoyé au ${telephone}`,
      erreur: 'Ce code n’est pas bon. Vérifie le SMS.',
      renvoyer: 'Renvoyer le code',
      renvoyerDans: (secondes: number) => `Renvoyer le code dans ${secondes} s`,
      verification: 'Vérification…',
    },
    prenom: {
      titre: 'Ton prénom',
      aide: 'Visible dans tes tontines',
      placeholder: 'Prénom',
      invalide: 'Entre 2 et 30 lettres.',
    },
    consentement: {
      titre: 'Tes données',
      texte:
        'Natt garde ton prénom, ton numéro et l’historique de tes paiements pour faire fonctionner tes tontines. Ces informations sont visibles par les membres de tes tontines. Natt ne les vend jamais.',
      caseLibelle: 'J’accepte que Natt utilise mes données',
      mesDroits: 'Mes droits',
      bouton: 'Créer mon compte',
    },
    droits: {
      titre: 'Mes droits',
      lignes: [
        'Tu peux voir tes données à tout moment dans Profil → Mes données.',
        'Tu peux retirer ton consentement : ton compte est alors désactivé et ton prénom et ton numéro sont effacés.',
        'L’historique des paiements des tontines est gardé sans ton nom, pour les autres membres.',
        'Pour toute question, écris-nous sur WhatsApp depuis Profil → Aide.',
      ],
    },
  },
  profil: {
    deconnecter: 'Se déconnecter',
  },
  demo: {
    titre: 'Composants Natt',
    filAriane: 'Démonstration interne',
    sections: {
      boutons: 'Boutons',
      clavier: 'Clavier et code',
      champs: 'Champs et options',
      statuts: 'Statuts',
      listes: 'Cartes et listes',
      divers: 'Divers',
    },
    exemples: {
      nomTontine: 'Tontine des sœurs',
      champPlaceholder: 'Nom de la tontine',
      optionClassique: 'Classique',
      optionClassiqueDetail: 'Chacun reçoit la cagnotte',
      optionAchat: 'Achat groupé',
      optionAchatDetail: 'Chacun reçoit un bien',
      interrupteur: '3 jours avant',
      notifTitre: 'Paiement reçu',
      notifTexte: (prenom: string, montant: string) => `${prenom} a payé ${montant}.`,
    },
  },
} as const;

export type Textes = typeof fr;
