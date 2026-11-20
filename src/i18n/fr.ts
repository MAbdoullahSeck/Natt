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
    creerTontine: 'Créer une tontine',
    rejoindreAvecCode: 'Rejoindre avec un code',
    membres: (n: number) => (n > 1 ? `${n} membres` : `${n} membre`),
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
