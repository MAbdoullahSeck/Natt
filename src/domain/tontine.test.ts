import {
  bilanMembre,
  type CotisationDonnees,
  prochainPaiement,
  resumeTour,
  statutMembre,
  tourDuMembre,
  tourEnCours,
  type TourDonnees,
} from './tontine';

const tours: TourDonnees[] = [
  {
    id: 't1',
    numero: 1,
    echeance: '2026-09-05',
    beneficiaire_membre_id: 'a',
    verse_at: '2026-09-05T10:00:00Z',
  },
  { id: 't2', numero: 2, echeance: '2026-10-05', beneficiaire_membre_id: 'b', verse_at: null },
  { id: 't3', numero: 3, echeance: '2026-11-05', beneficiaire_membre_id: 'c', verse_at: null },
];

const c = (
  tour_id: string,
  membre_id: string,
  statut: CotisationDonnees['statut'],
  declare_at: string | null = null,
): CotisationDonnees => ({
  id: `${tour_id}-${membre_id}`,
  tour_id,
  membre_id,
  statut,
  declare_at,
  paye_at: statut === 'paye' ? declare_at : null,
});

const cotisations = [
  c('t1', 'a', 'paye', '2026-09-01T10:00:00'),
  c('t1', 'b', 'paye', '2026-09-07T10:00:00'),
  c('t1', 'c', 'paye', '2026-09-02T10:00:00'),
  c('t2', 'a', 'paye', '2026-10-01T10:00:00'),
  c('t2', 'b', 'declare', '2026-10-04T10:00:00'),
  c('t2', 'c', 'a_payer'),
  c('t3', 'a', 'a_payer'),
  c('t3', 'b', 'a_payer'),
  c('t3', 'c', 'a_payer'),
];
const maintenant = new Date(2026, 9, 20);

describe('vue tontine', () => {
  it('tour en cours = premier tour non versé', () => {
    expect(tourEnCours(tours)?.numero).toBe(2);
    expect(tourEnCours(tours.map((t) => ({ ...t, verse_at: 'x' })))).toBeNull();
  });

  it('statut de chaque membre pour le tour', () => {
    expect(statutMembre(tours[1], cotisations, 'a', maintenant)).toBe('paye');
    expect(statutMembre(tours[1], cotisations, 'b', maintenant)).toBe('en_attente');
    expect(statutMembre(tours[1], cotisations, 'c', maintenant)).toBe('en_retard');
  });

  it('résumé : X F reçus, N sur M payés', () => {
    expect(resumeTour(10000, 3, tours[1], cotisations)).toEqual({
      cagnotte: 30000,
      recu: 10000,
      nbPayes: 1,
      nbMembres: 3,
      toutPaye: false,
    });
    expect(resumeTour(10000, 3, tours[0], cotisations).toutPaye).toBe(true);
  });

  it('prochain paiement : plus ancienne cotisation non payée', () => {
    expect(prochainPaiement(tours, cotisations, 'c')?.tour.numero).toBe(2);
    expect(prochainPaiement(tours, cotisations, 'a')?.tour.numero).toBe(3);
    expect(prochainPaiement(tours, cotisations, 'zzz')).toBeNull();
  });

  it('tour du membre', () => {
    expect(tourDuMembre(tours, 'c')?.numero).toBe(3);
  });

  it('bilan : à l’heure et en retard', () => {
    expect(bilanMembre(tours, cotisations, 'a', maintenant)).toEqual({ aLHeure: 2, enRetard: 0 });
    // b : tour 1 payé en retard, tour 2 déclaré à temps.
    expect(bilanMembre(tours, cotisations, 'b', maintenant)).toEqual({ aLHeure: 1, enRetard: 1 });
    // c : tour 1 à l'heure, tour 2 toujours impayé après l'échéance.
    expect(bilanMembre(tours, cotisations, 'c', maintenant)).toEqual({ aLHeure: 1, enRetard: 1 });
  });
});
