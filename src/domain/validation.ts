/** Règles de saisie des formulaires (cahier des charges, partie 1). */

/** Écran 03 : prénom de 2 à 30 caractères. */
export function prenomValide(prenom: string): boolean {
  const n = prenom.trim().length;
  return n >= 2 && n <= 30;
}

/** Écran 06 : nom de tontine de 2 à 40 caractères. */
export function nomTontineValide(nom: string): boolean {
  const n = nom.trim().length;
  return n >= 2 && n <= 40;
}

/** Écran 06b : bien prévu obligatoire pour un achat groupé. */
export function bienPrevuValide(bien: string): boolean {
  const n = bien.trim().length;
  return n >= 2 && n <= 40;
}

export const MONTANT_MINIMUM = 500;
export const MONTANT_MAXIMUM = 10_000_000;

/** Écran 07 : montant en FCFA, minimum 500 F. */
export function montantValide(montant: number): boolean {
  return Number.isInteger(montant) && montant >= MONTANT_MINIMUM && montant <= MONTANT_MAXIMUM;
}

export const MEMBRES_MINIMUM = 2;
export const MEMBRES_MAXIMUM = 50;

/** Écran 09 : 2 à 50 membres, gérante comprise. */
export function nbMembresValide(n: number): boolean {
  return Number.isInteger(n) && n >= MEMBRES_MINIMUM && n <= MEMBRES_MAXIMUM;
}
