import { ratioContraste } from './contraste';
import { palettes } from './couleurs';
import { schemaPour } from './theme';

const AA = 4.5;
/** Texte de grande taille (≥ 18,66 px gras ou 24 px) : seuil AA de 3:1. */
const AA_GRAND = 3;

/**
 * Écarts de la palette CLAIRE (couleurs du Figma, qui fait foi) : à arbitrer, voir docs/decisions.md.
 * La palette sombre, elle, atteint AA (4,5:1) partout.
 */
const ECARTS_FIGMA_CLAIR = new Set(['« En retard »', 'lien terracotta']);

const paires = (c: (typeof palettes)['clair']) =>
  [
    ['« Payé »', c.vert, c.vertPuce, AA],
    ['« En attente »', c.texteSecondaire, c.grisPuce, AA],
    ['« En retard »', c.terracotta, c.terracottaPuce, AA],
    ['texte principal', c.texte, c.fond, AA],
    ['texte secondaire', c.texteSecondaire, c.fond, AA],
    ['texte secondaire sur carte', c.texteSecondaire, c.surface, AA],
    ['texte sur carte d’information', c.texte, c.terracottaClair, AA],
    ['lien terracotta', c.terracotta, c.fond, AA],
    ['bouton principal (20 px gras)', c.blanc, c.fondAccent, AA_GRAND],
    ['bouton désactivé', c.texteSecondaire, c.desactive, AA],
    ['chiffres du pavé', c.texte, c.surface, AA],
  ] as const;

describe('palette sombre : contrastes WCAG AA', () => {
  it.each(paires(palettes.sombre))('%s', (_l, texte, fond) => {
    expect(ratioContraste(texte, fond)).toBeGreaterThanOrEqual(AA);
  });
});

describe('palette claire (Figma) : contrastes', () => {
  it.each(paires(palettes.clair).filter(([l]) => !ECARTS_FIGMA_CLAIR.has(l)))(
    '%s',
    (_l, texte, fond, seuil) => {
      expect(ratioContraste(texte, fond)).toBeGreaterThanOrEqual(seuil);
    },
  );
  it('écarts connus du Figma : au moins le seuil des grands textes (3:1)', () => {
    for (const [l, texte, fond] of paires(palettes.clair)) {
      if (ECARTS_FIGMA_CLAIR.has(l)) {
        const r = ratioContraste(texte, fond);
        expect(r).toBeGreaterThanOrEqual(AA_GRAND);
        expect(r).toBeLessThan(AA);
      }
    }
  });
});

describe('apparence', () => {
  it('mêmes jetons dans les deux palettes', () => {
    expect(Object.keys(palettes.sombre).sort()).toEqual(Object.keys(palettes.clair).sort());
  });
  it('automatique suit le téléphone', () => {
    expect(schemaPour('automatique', 'dark')).toBe('sombre');
    expect(schemaPour('automatique', 'light')).toBe('clair');
    expect(schemaPour('automatique', null)).toBe('clair');
    expect(schemaPour('sombre', 'light')).toBe('sombre');
    expect(schemaPour('clair', 'dark')).toBe('clair');
  });
  it('rapport de contraste connu', () => {
    expect(ratioContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });
});
