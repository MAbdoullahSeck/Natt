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
  erreurs: {
    reseau: 'Pas de connexion. Vérifie ton internet.',
    inconnue: 'Un problème est survenu. Réessaie.',
    reessayer: 'Réessayer',
    codes: {
      non_connecte: 'Reconnecte-toi pour continuer.',
      prenom_invalide: 'Le prénom doit faire entre 2 et 30 lettres.',
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
