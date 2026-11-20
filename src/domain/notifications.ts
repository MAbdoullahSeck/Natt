import { compareJours, jour } from './dates';

/** Groupes de notifications par jour (écran 22), du plus récent au plus ancien. */
export type GroupeJour<T> = { jour: Date; elements: T[] };

export function grouperParJour<T extends { created_at: string }>(elements: T[]): GroupeJour<T>[] {
  const tries = [...elements].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const groupes: GroupeJour<T>[] = [];
  for (const e of tries) {
    const j = jour(new Date(e.created_at));
    const dernier = groupes[groupes.length - 1];
    if (dernier && compareJours(dernier.jour, j) === 0) dernier.elements.push(e);
    else groupes.push({ jour: j, elements: [e] });
  }
  return groupes;
}

/** « aujourdhui », « hier » ou null (afficher la date). */
export function jourRelatif(j: Date, maintenant = new Date()): 'aujourdhui' | 'hier' | null {
  const ecart = Math.round(compareJours(maintenant, j) / 86_400_000);
  if (ecart === 0) return 'aujourdhui';
  if (ecart === 1) return 'hier';
  return null;
}

type Evenement = { id: string; type: string; donnees: unknown; membre_id: string | null };

export type Penalite = { id: string; montant: number; tour: number; annulee: boolean };

/** P5 : pénalités d'un membre, avec leur état (annulée ou non). */
export function penalitesDuMembre(evenements: Evenement[], membreId: string): Penalite[] {
  const annulees = new Set(
    evenements
      .filter((e) => e.type === 'penalite_annulee')
      .map((e) => String((e.donnees as Record<string, unknown> | null)?.penalite_id ?? '')),
  );
  return evenements
    .filter((e) => e.type === 'penalite' && e.membre_id === membreId)
    .map((e) => {
      const d = (e.donnees ?? {}) as Record<string, unknown>;
      return {
        id: e.id,
        montant: Number(d.montant ?? 0),
        tour: Number(d.tour ?? 0),
        annulee: annulees.has(e.id),
      };
    });
}

export function totalPenalites(penalites: Penalite[]): number {
  return penalites.filter((p) => !p.annulee).reduce((s, p) => s + p.montant, 0);
}
