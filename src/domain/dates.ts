import { versDate } from '@/lib/format';

/** Dates « calendaires » (sans heure), en heure locale. Miroir des fonctions SQL. */

export type Frequence = 'jour' | 'semaine' | 'mois';

export function jour(d: Date | string): Date {
  const x = versDate(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

export function ajouterJours(d: Date | string, n: number): Date {
  const x = jour(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
}

/** Ajoute n mois en ramenant au dernier jour du mois si besoin (comme Postgres). */
export function ajouterMois(d: Date | string, n: number): Date {
  const x = jour(d);
  const cible = new Date(x.getFullYear(), x.getMonth() + n, 1);
  const dernierJour = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
  return new Date(cible.getFullYear(), cible.getMonth(), Math.min(x.getDate(), dernierJour));
}

export function ajouterPeriodes(d: Date | string, frequence: Frequence, n: number): Date {
  if (frequence === 'jour') return ajouterJours(d, n);
  if (frequence === 'semaine') return ajouterJours(d, 7 * n);
  return ajouterMois(d, n);
}

/** T5 : échéance du tour `numero` (1..N). */
export function echeanceTour(debut: Date | string, frequence: Frequence, numero: number): Date {
  return ajouterPeriodes(debut, frequence, numero - 1);
}

export function echeances(debut: Date | string, frequence: Frequence, nb: number): Date[] {
  return Array.from({ length: nb }, (_, i) => echeanceTour(debut, frequence, i + 1));
}

export function memeJour(a: Date | string, b: Date | string): boolean {
  return jour(a).getTime() === jour(b).getTime();
}

export function compareJours(a: Date | string, b: Date | string): number {
  return jour(a).getTime() - jour(b).getTime();
}

/** « 2026-12-05 » (format des colonnes SQL `date`). */
export function versISO(d: Date | string): string {
  const x = jour(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const j = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${j}`;
}
