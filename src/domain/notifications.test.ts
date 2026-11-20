import { grouperParJour, jourRelatif, penalitesDuMembre, totalPenalites } from './notifications';

describe('notifications par jour', () => {
  it('regroupe par jour, du plus récent au plus ancien', () => {
    const groupes = grouperParJour([
      { id: 'a', created_at: '2026-11-19T08:00:00' },
      { id: 'b', created_at: '2026-11-20T09:00:00' },
      { id: 'c', created_at: '2026-11-20T18:00:00' },
    ]);
    expect(groupes.map((g) => g.elements.map((e) => e.id))).toEqual([['c', 'b'], ['a']]);
  });
  it('aujourd’hui, hier, sinon date', () => {
    const maintenant = new Date(2026, 10, 20, 12);
    expect(jourRelatif(new Date(2026, 10, 20), maintenant)).toBe('aujourdhui');
    expect(jourRelatif(new Date(2026, 10, 19), maintenant)).toBe('hier');
    expect(jourRelatif(new Date(2026, 10, 10), maintenant)).toBeNull();
  });
});

describe('pénalités (P5)', () => {
  const evenements = [
    { id: 'p1', type: 'penalite', membre_id: 'm', donnees: { montant: 1000, tour: 2 } },
    { id: 'p2', type: 'penalite', membre_id: 'm', donnees: { montant: 1000, tour: 3 } },
    { id: 'p3', type: 'penalite', membre_id: 'autre', donnees: { montant: 1000, tour: 3 } },
    { id: 'x', type: 'penalite_annulee', membre_id: 'm', donnees: { penalite_id: 'p1' } },
  ];
  it('liste les pénalités du membre et leur annulation', () => {
    expect(penalitesDuMembre(evenements, 'm')).toEqual([
      { id: 'p1', montant: 1000, tour: 2, annulee: true },
      { id: 'p2', montant: 1000, tour: 3, annulee: false },
    ]);
  });
  it('total hors pénalités annulées', () => {
    expect(totalPenalites(penalitesDuMembre(evenements, 'm'))).toBe(1000);
  });
});
