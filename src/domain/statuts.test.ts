import { statutAffiche } from './statuts';

const ECHEANCE = '2026-12-05';
const veille = new Date(2026, 11, 4, 18, 0);
const jourJ = new Date(2026, 11, 5, 23, 59);
const lendemain = new Date(2026, 11, 6, 0, 1);

describe('statutAffiche', () => {
  it('« Payé » dès que la gérante a confirmé, même après l’échéance', () => {
    expect(statutAffiche('paye', ECHEANCE, veille)).toBe('paye');
    expect(statutAffiche('paye', ECHEANCE, lendemain)).toBe('paye');
  });

  it('« En attente » avant ou le jour de l’échéance', () => {
    expect(statutAffiche('a_payer', ECHEANCE, veille)).toBe('en_attente');
    expect(statutAffiche('a_payer', ECHEANCE, jourJ)).toBe('en_attente');
  });

  it('un paiement déclaré reste « En attente » tant que la gérante n’a pas confirmé', () => {
    expect(statutAffiche('declare', ECHEANCE, jourJ)).toBe('en_attente');
  });

  it('« En retard » le lendemain de l’échéance si non payé', () => {
    expect(statutAffiche('a_payer', ECHEANCE, lendemain)).toBe('en_retard');
    expect(statutAffiche('declare', ECHEANCE, lendemain)).toBe('en_retard');
  });

  it('accepte une Date comme échéance', () => {
    expect(statutAffiche('a_payer', new Date(2026, 11, 5), lendemain)).toBe('en_retard');
  });
});
