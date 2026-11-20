/** Invitation à rejoindre une tontine (logique pure, testée avec Jest). */
export const PACKAGE_ANDROID = 'sn.natt.app';
export const URL_PLAY_STORE = `https://play.google.com/store/apps/details?id=${PACKAGE_ANDROID}`;

export function codeValide(code: string | null | undefined): code is string {
  return !!code && /^\d{6}$/.test(code);
}

/** Lien qui ouvre l'app directement sur l'aperçu de la tontine (écran 12c). */
export function lienApp(code: string): string {
  return `natt://rejoindre?code=${code}`;
}

/**
 * Page de secours en texte simple : Supabase sert le HTML en texte brut sur *.supabase.co,
 * une page texte bien présentée reste lisible dans tous les navigateurs.
 */
export function pageTexte(code: string | null): string {
  if (!codeValide(code)) {
    return [
      'Natt — Invitation',
      '',
      'Ce lien d’invitation n’est pas valable.',
      'Demande le code à 6 chiffres à ta gérante.',
    ].join('\n');
  }
  const groupes = `${code.slice(0, 3)} ${code.slice(3)}`;
  return [
    'Natt — Invitation à rejoindre une tontine',
    '',
    `Code de la tontine : ${groupes}`,
    '',
    '1. Installe Natt sur ton téléphone :',
    `   ${URL_PLAY_STORE}`,
    '2. Ouvre Natt et inscris-toi avec ton numéro.',
    '3. Touche « Rejoindre avec un code » et tape le code ci-dessus.',
    '',
    'Natt est déjà installée ? Ouvre Natt, touche « Rejoindre avec un code » et tape le code.',
    '',
    'Natt ne garde jamais l’argent : tu paies directement ta gérante par Wave ou Orange Money.',
  ].join('\n');
}
