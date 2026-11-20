import { limiteAtteinte, limiteTontines, palierActif, palierSuperieur, PRIX } from './abonnement';

describe('abonnement (B1–B4)', () => {
  it('limites par palier', () => {
    expect(limiteTontines('starter')).toBe(2);
    expect(limiteTontines('pro')).toBe(6);
    expect(limiteTontines('illimite')).toBeNull();
    expect(limiteTontines(null)).toBe(0);
    expect(limiteTontines(null, true)).toBe(2);
  });
  it('limite atteinte', () => {
    expect(limiteAtteinte('starter', 1)).toBe(false);
    expect(limiteAtteinte('starter', 2)).toBe(true);
    expect(limiteAtteinte('illimite', 100)).toBe(false);
    expect(limiteAtteinte(null, 0)).toBe(true);
  });
  it('palier supérieur présélectionné (B3)', () => {
    expect(palierSuperieur(null)).toBe('starter');
    expect(palierSuperieur('starter')).toBe('pro');
    expect(palierSuperieur('pro')).toBe('illimite');
  });
  it('annuel = 10 mois (2 mois offerts)', () => {
    for (const p of ['starter', 'pro', 'illimite'] as const) {
      expect(PRIX[p].annuel).toBe(PRIX[p].mensuel * 10);
    }
  });
  it('palier actif : meilleur abonnement actif non expiré', () => {
    const maintenant = new Date('2026-11-20T10:00:00Z');
    expect(
      palierActif(
        [
          { palier: 'pro', statut: 'expire', expire_at: '2026-11-01T00:00:00Z' },
          { palier: 'starter', statut: 'actif', expire_at: '2026-12-01T00:00:00Z' },
          { palier: 'illimite', statut: 'en_attente', expire_at: null },
          { palier: 'pro', statut: 'actif', expire_at: '2026-11-19T00:00:00Z' },
        ],
        maintenant,
      ),
    ).toBe('starter');
    expect(palierActif([], maintenant)).toBeNull();
  });
});
