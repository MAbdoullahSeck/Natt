/**
 * Numéros sénégalais (écran 01) : indicatif +221 et 9 chiffres commençant par 7 (mobiles).
 * Supabase Auth stocke le numéro sans « + » : « 221771234567 ».
 */
export const INDICATIF = '221';
export const LONGUEUR_NUMERO = 9;

/** Garde uniquement les chiffres, sans l'indicatif, au plus 9 chiffres. */
export function nettoyerNumero(saisie: string): string {
  let chiffres = saisie.replace(/\D/g, '');
  if (chiffres.length > LONGUEUR_NUMERO && chiffres.startsWith(INDICATIF)) {
    chiffres = chiffres.slice(INDICATIF.length);
  }
  return chiffres.slice(0, LONGUEUR_NUMERO);
}

export function numeroValide(numero: string): boolean {
  return /^7\d{8}$/.test(numero);
}

/** Format international pour Supabase Auth : « +221771234567 ». */
export function numeroInternational(numero: string): string {
  return `+${INDICATIF}${nettoyerNumero(numero)}`;
}

/** Affichage par groupes : « 77 123 45 67 » (accepte aussi « 221771234567 »). */
export function formatTelephone(numero: string): string {
  const n = nettoyerNumero(numero);
  const groupes = [n.slice(0, 2), n.slice(2, 5), n.slice(5, 7), n.slice(7, 9)].filter(Boolean);
  return groupes.join(' ');
}

/** « +221 77 123 45 67 ». */
export function formatTelephoneComplet(numero: string): string {
  return `+${INDICATIF} ${formatTelephone(numero)}`;
}
