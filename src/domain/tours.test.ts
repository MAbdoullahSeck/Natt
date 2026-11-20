import {
  depuisHex,
  melanger,
  nouvelleGraine,
  versHex,
} from '../../supabase/functions/_shared/melange';

import type { TourDonnees } from './tontine';
import { echangerOrdre, partenairesPossibles, peutEchanger, tiragePossible } from './tours';

const tours: TourDonnees[] = [
  {
    id: '1',
    numero: 1,
    echeance: '2027-01-05',
    beneficiaire_membre_id: 'a',
    verse_at: '2027-01-05',
  },
  { id: '2', numero: 2, echeance: '2027-02-05', beneficiaire_membre_id: 'b', verse_at: null },
  { id: '3', numero: 3, echeance: '2027-03-05', beneficiaire_membre_id: 'c', verse_at: null },
  { id: '4', numero: 4, echeance: '2027-04-05', beneficiaire_membre_id: 'd', verse_at: null },
];

describe('échange de tours (O3)', () => {
  it('seulement entre tours non versés', () => {
    expect(peutEchanger(tours, 'b', 'c')).toBe(true);
    expect(peutEchanger(tours, 'a', 'c')).toBe(false);
    expect(peutEchanger(tours, 'b', 'b')).toBe(false);
    expect(peutEchanger(tours, 'b', 'inconnu')).toBe(false);
  });
  it('partenaires possibles', () => {
    expect(partenairesPossibles(tours, 'b')).toEqual(['c', 'd']);
    expect(partenairesPossibles(tours, 'a')).toEqual([]);
  });
  it('échange de deux membres dans l’ordre', () => {
    expect(echangerOrdre(['a', 'b', 'c', 'd'], 'b', 'd')).toEqual(['a', 'd', 'c', 'b']);
  });
});

describe('tirage au sort (O2)', () => {
  const sansVersement = tours.map((t) => ({ ...t, verse_at: null }));
  it('possible une fois, tontine complète, avant toute remise', () => {
    expect(tiragePossible(sansVersement, 4, 4, false)).toBe(true);
    expect(tiragePossible(sansVersement, 3, 4, false)).toBe(false);
    expect(tiragePossible(sansVersement, 4, 4, true)).toBe(false);
    expect(tiragePossible(tours, 4, 4, false)).toBe(false);
  });

  it('mélange : permutation des mêmes membres', async () => {
    const membres = Array.from({ length: 20 }, (_, i) => `m${i}`);
    const ordre = await melanger(membres, nouvelleGraine());
    expect([...ordre].sort()).toEqual([...membres].sort());
  });

  it('mélange vérifiable : même graine, même ordre', async () => {
    const graine = versHex(nouvelleGraine());
    const membres = ['a', 'b', 'c', 'd', 'e', 'f'];
    const un = await melanger(membres, depuisHex(graine));
    const deux = await melanger(membres, depuisHex(graine));
    expect(un).toEqual(deux);
    expect(graine).toHaveLength(64);
  });

  it('mélange équitable : chaque membre est 1er environ une fois sur 3', async () => {
    const compte: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 600; i++) {
      const [premier] = await melanger(['a', 'b', 'c'], nouvelleGraine());
      compte[premier] += 1;
    }
    for (const n of Object.values(compte)) {
      expect(n).toBeGreaterThan(140);
      expect(n).toBeLessThan(260);
    }
  });
});
