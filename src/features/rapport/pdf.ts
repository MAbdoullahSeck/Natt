import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Génère le PDF du rapport puis ouvre le partage du téléphone (WhatsApp, enregistrement…).
 * Sur le web : fenêtre d'impression du navigateur (« Enregistrer en PDF »).
 */
export async function partagerPdf(html: string, titre: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: titre,
    });
  }
}
