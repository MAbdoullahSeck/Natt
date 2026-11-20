import { Linking, Share } from 'react-native';

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
