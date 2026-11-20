import { cagnotteApresSuppression, possibiliteRetrait } from './retrait';
import type { TourDonnees } from './tontine';

const tours: TourDonnees[] = [
  {
    id: '1',
    numero: 1,
    echeance: '2027-01-05',
    beneficiaire_membre_id: 'g',
    verse_at: '2027-01-05',
  },
  {
    id: '2',
    numero: 2,
    echeance: '2027-02-05',
    beneficiaire_membre_id: 'a',
    verse_at: '2027-02-05',
  },
  { id: '3', numero: 3, echeance: '2027-03-05', beneficiaire_membre_id: 'b', verse_at: null },
];

describe('retrait d’un membre', () => {
  it('avant le démarrage : libre, sans choix', () => {
    expect(
      possibiliteRetrait({
        statutTontine: 'en_preparation',
        estLaGerante: false,
        membreId: 'b',
        tours,
      }),
    ).toEqual({
      possible: true,
      choixDuMode: false,
    });
  });
  it('pendant le cycle, pas encore servi : remplaçante ou tour supprimé', () => {
    expect(
      possibiliteRetrait({ statutTontine: 'en_cours', estLaGerante: false, membreId: 'b', tours }),
    ).toEqual({
      possible: true,
      choixDuMode: true,
    });
  });
  it('déjà servi : impossible', () => {
    expect(
      possibiliteRetrait({ statutTontine: 'en_cours', estLaGerante: false, membreId: 'a', tours }),
    ).toEqual({
      possible: false,
      raison: 'deja_servi',
    });
  });
  it('jamais la gérante, jamais une tontine terminée', () => {
    expect(
      possibiliteRetrait({ statutTontine: 'en_cours', estLaGerante: true, membreId: 'g', tours }),
    ).toMatchObject({
      raison: 'gerante',
    });
    expect(
      possibiliteRetrait({ statutTontine: 'terminee', estLaGerante: false, membreId: 'b', tours }),
    ).toMatchObject({
      raison: 'terminee',
    });
  });
  it('cagnotte recalculée', () => {
    expect(cagnotteApresSuppression(10000, 6)).toBe(50000);
  });
});
