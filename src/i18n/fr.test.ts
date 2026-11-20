import { textes } from './index';

describe('textes', () => {
  it('les messages partagés contiennent de vrais retours à la ligne', () => {
    expect(textes.creation.cree.message('T', '123456', 'lien')).toContain('\n');
    expect(textes.creation.cree.message('T', '123456', 'lien')).not.toContain('\\n');
    expect(textes.rapport.message('T', 'x')).toBe('Rapport du cycle « T » (Natt)\nx');
    expect(textes.tours.resultat.message('T', 'x')).not.toContain('\\n');
  });
});
