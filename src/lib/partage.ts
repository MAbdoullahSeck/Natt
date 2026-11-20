import { Linking, Share } from 'react-native';

/** Lien profond vers l'écran Rejoindre avec le code prérempli. */
export function lienRejoindre(code: string): string {
  return `natt://rejoindre?code=${code}`;
}

/**
 * « Partager sur WhatsApp » : ouvre WhatsApp avec le message prérempli,
 * sinon la feuille de partage du téléphone.
 */
export async function partagerWhatsApp(message: string): Promise<void> {
  try {
    await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
  } catch {
    await Share.share({ message });
  }
}
