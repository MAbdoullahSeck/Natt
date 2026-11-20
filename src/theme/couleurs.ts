/**
 * Jetons de couleur — docs/design-system.md (Figma fait foi pour le clair).
 * Deux palettes de mêmes clés : `clair` et `sombre`. Les écrans n'importent jamais une palette
 * directement : ils passent par `useCouleurs()` ou `creerStyles()` (voir ./theme.tsx).
 */
const clair = {
  fond: '#FFFFFF',
  terracotta: '#C65D3B',
  /** Fond plein des boutons et éléments terracotta qui portent un texte blanc. */
  fondAccent: '#C65D3B',
  terracottaClair: '#FAF4F0',
  terracottaPuce: '#FAEEE8',
  vert: '#1F6B4F',
  vertPuce: '#EAF3EE',
  texte: '#1C1C1C',
  texteSecondaire: '#68645F',
  grisPuce: '#F1F0ED',
  surface: '#F6F5F2',
  bordure: '#DCD8D2',
  bordureBoutonSecondaire: '#BDB8B1',
  bordureChamp: '#A5A09A',
  separateur: '#E8E5DF',
  desactive: '#E5E2DD',
  blanc: '#FFFFFF',
};

export type Palette = typeof clair;
export type Couleur = keyof Palette;

/** Palette sombre : fonds sombres, textes clairs, terracotta et vert éclaircis (contraste WCAG AA). */
const sombre: Palette = {
  fond: '#121110',
  terracotta: '#E8896A',
  fondAccent: '#B5532F',
  terracottaClair: '#2A201B',
  terracottaPuce: '#3D241B',
  vert: '#6BCB9B',
  vertPuce: '#17332A',
  texte: '#F2EFEA',
  texteSecondaire: '#B5AFA7',
  grisPuce: '#2E2B28',
  surface: '#1F1D1B',
  bordure: '#3A3633',
  bordureBoutonSecondaire: '#5A5550',
  bordureChamp: '#7A746D',
  separateur: '#2E2B28',
  desactive: '#2E2B28',
  blanc: '#FFFFFF',
};

export const palettes = { clair, sombre } as const;
export type NomPalette = keyof typeof palettes;
