import { estPenalisable, statutAffiche } from './statuts';

const ECHEANCE = '2026-12-05';
const veille = new Date(2026, 11, 4, 18, 0);
const jourJ = new Date(2026, 11, 5, 23, 59);
const lendemain = new Date(2026, 11, 6, 0, 1);
const semaineApres = new Date(2026, 11, 12, 10, 0);

describe('statutAffiche (P1)', () => {
  it('« Payé » dès que la gérante a confirmé, même après l’échéance', () => {
    expect(statutAffiche({ statut: 'paye' }, ECHEANCE, veille)).toBe('paye');
    expect(statutAffiche({ statut: 'paye' }, ECHEANCE, semaineApres)).toBe('paye');
  });

  it('« En attente » avant ou le jour de l’échéance', () => {
    expect(statutAffiche({ statut: 'a_payer' }, ECHEANCE, veille)).toBe('en_attente');
    expect(statutAffiche({ statut: 'a_payer' }, ECHEANCE, jourJ)).toBe('en_attente');
  });

  it('« En retard » le lendemain de l’échéance si rien n’a été déclaré', () => {
    expect(statutAffiche({ statut: 'a_payer' }, ECHEANCE, lendemain)).toBe('en_retard');
  });

  it('déclaré avant l’échéance : reste « En attente » même une fois l’échéance passée', () => {
    const c = { statut: 'declare' as const, declareAt: veille };
    expect(statutAffiche(c, ECHEANCE, jourJ)).toBe('en_attente');
    expect(statutAffiche(c, ECHEANCE, semaineApres)).toBe('en_attente');
  });

  it('déclaré le jour de l’échéance : à l’heure', () => {
    const c = { statut: 'declare' as const, declareAt: jourJ };
    expect(statutAffiche(c, ECHEANCE, semaineApres)).toBe('en_attente');
  });

  it('déclaré après l’échéance : « En retard » tant que la gérante n’a pas confirmé', () => {
    const c = { statut: 'declare' as const, declareAt: lendemain };
    expect(statutAffiche(c, ECHEANCE, semaineApres)).toBe('en_retard');
  });

  it('accepte des dates sous forme de chaînes', () => {
    const c = { statut: 'declare' as const, declareAt: '2026-12-04T10:00:00' };
    expect(statutAffiche(c, ECHEANCE, semaineApres)).toBe('en_attente');
  });
});

describe('estPenalisable (P5)', () => {
  it('pas de pénalité avant ou le jour de l’échéance', () => {
    expect(estPenalisable({ statut: 'a_payer' }, ECHEANCE, jourJ)).toBe(false);
  });

  it('pénalité si rien n’est déclaré après l’échéance', () => {
    expect(estPenalisable({ statut: 'a_payer' }, ECHEANCE, lendemain)).toBe(true);
  });

  it('pas de pénalité si la déclaration est faite à temps, même confirmée en retard', () => {
    expect(estPenalisable({ statut: 'declare', declareAt: veille }, ECHEANCE, semaineApres)).toBe(
      false,
    );
    expect(
      estPenalisable({ statut: 'paye', declareAt: jourJ, payeAt: semaineApres }, ECHEANCE),
    ).toBe(false);
  });

  it('pénalité si la déclaration est faite après l’échéance', () => {
    expect(
      estPenalisable({ statut: 'declare', declareAt: lendemain }, ECHEANCE, semaineApres),
    ).toBe(true);
    expect(
      estPenalisable({ statut: 'paye', declareAt: lendemain, payeAt: lendemain }, ECHEANCE),
    ).toBe(true);
  });

  it('paiement confirmé sans déclaration (ex. espèces) : on regarde la date de confirmation', () => {
    expect(estPenalisable({ statut: 'paye', payeAt: veille }, ECHEANCE)).toBe(false);
    expect(estPenalisable({ statut: 'paye', payeAt: semaineApres }, ECHEANCE)).toBe(true);
  });
});
