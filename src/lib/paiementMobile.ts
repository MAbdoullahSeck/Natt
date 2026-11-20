import * as Clipboard from 'expo-clipboard';
import { Linking, Platform } from 'react-native';

/**
 * Ouverture de Wave / Orange Money pour payer la gérante (règle P2).
 *
 * ⚠️ Module unique à modifier quand les liens profonds officiels seront confirmés.
 * À ce jour, aucun des deux opérateurs ne publie de lien pour un transfert entre particuliers
 * avec numéro et montant préremplis. On fait donc, dans l'ordre :
 *   1. copie du numéro de la gérante dans le presse-papiers ;
 *   2. tentative d'ouverture de l'application (schémas à confirmer) ;
 *   3. à défaut : Orange Money → composeur avec le code USSD #144# ; Wave → page de l'app dans le Store.
 * Le montant est affiché en gros à l'écran (il ne peut pas être prérempli).
 *
 * Natt ne reçoit, ne garde et ne transfère jamais d'argent.
 */
export type Moyen = 'wave' | 'orange_money';

export const MOYENS: Moyen[] = ['wave', 'orange_money'];

type Configuration = {
  /** Schémas d'URL essayés dans l'ordre (non documentés officiellement : à vérifier sur téléphone). */
  schemas: string[];
  /** Solution de secours si aucun schéma ne s'ouvre. */
  secours: { android: string; ios: string };
};

export const CONFIGURATION: Record<Moyen, Configuration> = {
  wave: {
    schemas: ['wave://'],
    secours: {
      android: 'market://details?id=com.wave.personal',
      ios: 'https://apps.apple.com/app/wave-mobile-money/id1523884528',
    },
  },
  orange_money: {
    schemas: ['orangemoney://'],
    // USSD Orange Money Sénégal : « # » doit être encodé (%23).
    secours: { android: 'tel:%23144%23', ios: 'tel:%23144%23' },
  },
};

/** Numéro local à saisir dans l'application de paiement : « 771234567 » (sans indicatif). */
export function numeroPourPaiement(telephone: string): string {
  const chiffres = telephone.replace(/\D/g, '');
  return chiffres.startsWith('221') && chiffres.length === 12 ? chiffres.slice(3) : chiffres;
}

export type ResultatOuverture = 'application' | 'secours' | 'copie_seulement';

/** Copie le numéro puis ouvre l'application de paiement (ou sa solution de secours). */
export async function ouvrirPaiement(
  moyen: Moyen,
  telephoneGerante: string,
): Promise<ResultatOuverture> {
  await Clipboard.setStringAsync(numeroPourPaiement(telephoneGerante)).catch(() => undefined);
  if (Platform.OS === 'web') return 'copie_seulement';

  const config = CONFIGURATION[moyen];
  for (const schema of config.schemas) {
    try {
      await Linking.openURL(schema);
      return 'application';
    } catch {
      // schéma non pris en charge : on essaie le suivant.
    }
  }
  try {
    await Linking.openURL(Platform.OS === 'ios' ? config.secours.ios : config.secours.android);
    return 'secours';
  } catch {
    return 'copie_seulement';
  }
}
