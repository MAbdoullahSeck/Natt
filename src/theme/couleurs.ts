/** Jetons de couleur — docs/design-system.md (Figma fait foi). */
export const couleurs = {
  fond: '#FFFFFF',
  terracotta: '#C65D3B',
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
} as const;

export type Couleur = keyof typeof couleurs;
