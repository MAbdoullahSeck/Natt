/** Abonnement de la gérante (B1–B4). Miroir de la fonction SQL `limite_tontines`. */
export type Palier = 'starter' | 'pro' | 'illimite';
export type Periodicite = 'mensuel' | 'annuel';

export const PALIERS: Palier[] = ['starter', 'pro', 'illimite'];

/** B1 : prix en FCFA. Annuel = 10 mois (« 2 mois offerts »). */
export const PRIX: Record<Palier, Record<Periodicite, number>> = {
  starter: { mensuel: 1000, annuel: 10000 },
  pro: { mensuel: 2500, annuel: 25000 },
  illimite: { mensuel: 5000, annuel: 50000 },
};

/** Prix plein d'un an (12 mois), affiché barré à côté du prix annuel réel. */
export function prixPleinAnnuel(palier: Palier): number {
  return PRIX[palier].mensuel * 12;
}

/** Nombre de mois offerts par l'abonnement annuel. */
export function moisOfferts(palier: Palier): number {
  return Math.round((prixPleinAnnuel(palier) - PRIX[palier].annuel) / PRIX[palier].mensuel);
}

/** Nombre maximal de tontines gérées non terminées. `null` = illimité. */
export const LIMITES: Record<Palier, number | null> = {
  starter: 2,
  pro: 6,
  illimite: null,
};

/** Sans abonnement actif : 0, sauf gérante fondatrice (limite Starter). */
export function limiteTontines(palier: Palier | null, fondatrice = false): number | null {
  if (!palier) return fondatrice ? LIMITES.starter : 0;
  return LIMITES[palier];
}

export function limiteAtteinte(
  palier: Palier | null,
  nbTontinesGereesEnCours: number,
  fondatrice = false,
): boolean {
  const limite = limiteTontines(palier, fondatrice);
  return limite !== null && nbTontinesGereesEnCours >= limite;
}

/** B3 : palier présélectionné quand la limite est atteinte. */
export function palierSuperieur(palier: Palier | null): Palier {
  if (!palier) return 'starter';
  if (palier === 'starter') return 'pro';
  return 'illimite';
}

export type Abonnement = {
  palier: Palier;
  statut: 'actif' | 'expire' | 'en_attente';
  expire_at: string | null;
};

/** Meilleur palier actif et non expiré. */
export function palierActif(abonnements: Abonnement[], maintenant = new Date()): Palier | null {
  const actifs = abonnements.filter(
    (a) => a.statut === 'actif' && (!a.expire_at || new Date(a.expire_at) > maintenant),
  );
  if (actifs.length === 0) return null;
  return actifs.sort((a, b) => PALIERS.indexOf(b.palier) - PALIERS.indexOf(a.palier))[0].palier;
}
