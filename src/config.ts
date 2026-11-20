/**
 * Réglages de l'application à renseigner avant le lancement (voir docs/decisions.md, étape 10).
 * Valeurs publiques uniquement : aucun secret ici.
 */
export const config = {
  /** Numéro WhatsApp de l'aide Natt (sans « + »), ex. « 221771234567 ». À RENSEIGNER. */
  numeroAideWhatsApp: process.env.EXPO_PUBLIC_NUMERO_AIDE ?? '',
  /** Numéro Wave de Natt pour payer les abonnements (B5, activation manuelle). À RENSEIGNER. */
  numeroWaveNatt: process.env.EXPO_PUBLIC_NUMERO_WAVE_NATT ?? '',
};
