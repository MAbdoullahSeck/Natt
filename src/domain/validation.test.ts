import {
  bienPrevuValide,
  montantValide,
  nbMembresValide,
  nomTontineValide,
  prenomValide,
} from './validation';

describe('validation des saisies', () => {
  it('prénom : 2 à 30 caractères', () => {
    expect(prenomValide('A')).toBe(false);
    expect(prenomValide('  Aw  ')).toBe(true);
    expect(prenomValide('a'.repeat(31))).toBe(false);
  });
  it('nom de tontine : 2 à 40 caractères', () => {
    expect(nomTontineValide('T')).toBe(false);
    expect(nomTontineValide('Tontine des sœurs')).toBe(true);
    expect(nomTontineValide('x'.repeat(41))).toBe(false);
  });
  it('bien prévu obligatoire', () => {
    expect(bienPrevuValide('')).toBe(false);
    expect(bienPrevuValide('Réfrigérateur')).toBe(true);
  });
  it('montant : minimum 500 F', () => {
    expect(montantValide(499)).toBe(false);
    expect(montantValide(500)).toBe(true);
    expect(montantValide(10.5)).toBe(false);
  });
  it('membres : 2 à 50', () => {
    expect(nbMembresValide(1)).toBe(false);
    expect(nbMembresValide(2)).toBe(true);
    expect(nbMembresValide(50)).toBe(true);
    expect(nbMembresValide(51)).toBe(false);
  });
});
