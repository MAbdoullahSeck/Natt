/**
 * Formats d'affichage — CLAUDE.md, règle 4.
 * Montants : « 10 000 F » (espace fine insécable U+202F entre milliers, espace insécable avant « F »).
 * Dates : « 5 décembre », « 5 décembre 2026 », « Janv. 2027 ».
 *
 * Implémentation manuelle (sans Intl) : le moteur Hermes d'Android n'a pas toujours
 * des données de locale françaises complètes.
 */

export const ESPACE_FINE_INSECABLE = ' ';
export const ESPACE_INSECABLE = ' ';

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

const MOIS_COURTS = [
  'Janv.',
  'Févr.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
] as const;

/** Sépare les milliers d'un entier avec une espace fine insécable : 10000 → « 10 000 ». */
export function formatNombre(valeur: number): string {
  const entier = Math.round(valeur);
  const signe = entier < 0 ? '-' : '';
  const chiffres = String(Math.abs(entier));
  return signe + chiffres.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE_INSECABLE);
}

/** Montant en FCFA : 10000 → « 10 000 F ». */
export function formatMontant(montant: number): string {
  return `${formatNombre(montant)}${ESPACE_INSECABLE}F`;
}

/**
 * Convertit une date ou une chaîne en Date « calendaire ».
 * Une chaîne `AAAA-MM-JJ` (colonne SQL `date`) est lue comme une date locale,
 * pour éviter tout décalage de fuseau.
 */
export function versDate(valeur: Date | string): Date {
  if (valeur instanceof Date) return valeur;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(valeur);
}

function jour(d: Date): string {
  const j = d.getDate();
  return j === 1 ? '1er' : String(j);
}

/** « 5 décembre » ; avec `annee: true` : « 5 décembre 2026 ». */
export function formatDate(valeur: Date | string, options: { annee?: boolean } = {}): string {
  const d = versDate(valeur);
  const base = `${jour(d)}${ESPACE_INSECABLE}${MOIS[d.getMonth()]}`;
  return options.annee ? `${base}${ESPACE_INSECABLE}${d.getFullYear()}` : base;
}

/** « Janv. 2027 ». */
export function formatMoisAnnee(valeur: Date | string): string {
  const d = versDate(valeur);
  return `${MOIS_COURTS[d.getMonth()]}${ESPACE_INSECABLE}${d.getFullYear()}`;
}

/** Nom du mois complet avec majuscule : « Décembre ». */
export function formatMois(valeur: Date | string): string {
  const nom = MOIS[versDate(valeur).getMonth()];
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

/** Heure au format français : « 9 h 05 ». */
export function formatHeure(valeur: Date | string): string {
  const d = versDate(valeur);
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${d.getHours()}${ESPACE_INSECABLE}h${ESPACE_INSECABLE}${minutes}`;
}
