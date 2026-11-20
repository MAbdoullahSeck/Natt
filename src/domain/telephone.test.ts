import {
  formatTelephone,
  formatTelephoneComplet,
  nettoyerNumero,
  numeroInternational,
  numeroValide,
} from './telephone';

describe('téléphone sénégalais', () => {
  it('nettoie la saisie et retire l’indicatif', () => {
    expect(nettoyerNumero('77 123 45 67')).toBe('771234567');
    expect(nettoyerNumero('+221 77 123 45 67')).toBe('771234567');
    expect(nettoyerNumero('2217712345678')).toBe('771234567');
  });

  it('valide 9 chiffres commençant par 7', () => {
    expect(numeroValide('771234567')).toBe(true);
    expect(numeroValide('701234567')).toBe(true);
    expect(numeroValide('77123456')).toBe(false);
    expect(numeroValide('331234567')).toBe(false);
  });

  it('format international pour Supabase', () => {
    expect(numeroInternational('771234567')).toBe('+221771234567');
  });

  it('affiche par groupes', () => {
    expect(formatTelephone('771234567')).toBe('77 123 45 67');
    expect(formatTelephone('221771234567')).toBe('77 123 45 67');
    expect(formatTelephone('7712')).toBe('77 12');
    expect(formatTelephoneComplet('221771234567')).toBe('+221 77 123 45 67');
  });
});
