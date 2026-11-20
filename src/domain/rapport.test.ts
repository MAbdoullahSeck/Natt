import { calculerRapport } from './rapport';
import type { CotisationDonnees, TourDonnees } from './tontine';

const tours: TourDonnees[] = [
  {
    id: 't1',
    numero: 1,
    echeance: '2026-09-05',
    beneficiaire_membre_id: 'a',
    verse_at: '2026-09-05',
  },
  {
    id: 't2',
    numero: 2,
    echeance: '2026-10-05',
    beneficiaire_membre_id: 'b',
    verse_at: '2026-10-05',
  },
];
const c = (tour: string, membre: string, declare: string): CotisationDonnees => ({
  id: `${tour}${membre}`,
  tour_id: tour,
  membre_id: membre,
  statut: 'paye',
  declare_at: declare,
  paye_at: declare,
});

describe('rapport de fin de cycle (F2)', () => {
  const rapport = calculerRapport(
    10000,
    2,
    [{ id: 'a' }, { id: 'b' }],
    tours,
    [
      c('t1', 'a', '2026-09-01T10:00:00'),
      c('t1', 'b', '2026-09-08T10:00:00'),
      c('t2', 'a', '2026-10-05T10:00:00'),
      c('t2', 'b', '2026-10-02T10:00:00'),
    ],
    [
      { id: 'p1', type: 'penalite', membre_id: 'b', donnees: { montant: 500, tour: 1 } },
      { id: 'p2', type: 'penalite', membre_id: 'b', donnees: { montant: 500, tour: 2 } },
      { id: 'x', type: 'penalite_annulee', membre_id: 'b', donnees: { penalite_id: 'p2' } },
    ],
  );

  it('total versé, tours et période', () => {
    expect(rapport.totalVerse).toBe(40000);
    expect(rapport.nbTours).toBe(2);
    expect(rapport.debut).toBe('2026-09-05');
    expect(rapport.fin).toBe('2026-10-05');
  });
  it('ponctualité et retards', () => {
    expect(rapport.pourcentageALHeure).toBe(75);
    expect(rapport.nbRetards).toBe(1);
    expect(rapport.ponctualite).toEqual([
      { membreId: 'a', aLHeure: 2, enRetard: 0 },
      { membreId: 'b', aLHeure: 1, enRetard: 1 },
    ]);
  });
  it('pénalités hors annulées', () => {
    expect(rapport.totalPenalites).toBe(500);
  });
});
