import { ajouterMois, echeances, echeanceTour, versISO } from './dates';

describe('échéances (T5)', () => {
  it('mensuelles, ramenées à la fin du mois comme Postgres', () => {
    expect(versISO(ajouterMois('2027-01-31', 1))).toBe('2027-02-28');
    expect(versISO(ajouterMois('2027-01-31', 2))).toBe('2027-03-31');
    expect(versISO(ajouterMois('2028-01-31', 1))).toBe('2028-02-29');
  });
  it('hebdomadaires et quotidiennes', () => {
    expect(versISO(echeanceTour('2027-01-01', 'semaine', 3))).toBe('2027-01-15');
    expect(versISO(echeanceTour('2027-12-31', 'jour', 2))).toBe('2028-01-01');
  });
  it('une échéance par membre, la première à la date de début', () => {
    expect(echeances('2026-12-05', 'mois', 3).map(versISO)).toEqual([
      '2026-12-05',
      '2027-01-05',
      '2027-02-05',
    ]);
  });
});
