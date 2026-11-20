import { suggererAjustement } from './calendrier';
import { echeanceTour, versISO } from './dates';

const TABASKI = { nom: 'Tabaski', date_debut: '2027-05-17' };

describe('suggestion de calendrier (C2)', () => {
  it('propose de caler un tour la veille de la Tabaski', () => {
    const s = suggererAjustement('2027-01-05', 'mois', 6, [TABASKI]);
    expect(s).not.toBeNull();
    expect(s!.evenement.nom).toBe('Tabaski');
    expect(s!.tour).toBe(5); // le 5 mai est le dernier tour avant le 17 mai
    expect(versISO(s!.nouvelleDate)).toBe('2027-01-16');
    expect(versISO(echeanceTour(s!.nouvelleDate, 'mois', 5))).toBe('2027-05-16');
  });

  it('rien si aucun événement ne tombe pendant le cycle', () => {
    expect(suggererAjustement('2027-06-01', 'mois', 3, [TABASKI])).toBeNull();
    expect(suggererAjustement('2027-01-05', 'mois', 2, [TABASKI])).toBeNull();
  });

  it('rien si un tour tombe déjà la veille', () => {
    expect(suggererAjustement('2027-01-16', 'mois', 6, [TABASKI])).toBeNull();
  });

  it('hebdomadaire : décalage de moins d’une semaine', () => {
    const s = suggererAjustement('2027-05-01', 'semaine', 4, [TABASKI]);
    expect(versISO(s!.nouvelleDate)).toBe('2027-05-02');
    expect(s!.tour).toBe(3);
  });

  it('pas de suggestion pour une tontine quotidienne', () => {
    expect(suggererAjustement('2027-05-01', 'jour', 30, [TABASKI])).toBeNull();
  });

  it('prend le premier événement exploitable', () => {
    const s = suggererAjustement('2027-01-05', 'mois', 6, [
      TABASKI,
      { nom: 'Korité', date_debut: '2027-03-10' },
    ]);
    expect(s!.evenement.nom).toBe('Korité');
    expect(versISO(s!.nouvelleDate)).toBe('2027-01-09');
  });
});
