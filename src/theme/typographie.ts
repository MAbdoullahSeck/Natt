import type { TextStyle } from 'react-native';

export const polices = {
  regular: 'Nunito_400Regular',
  bold: 'Nunito_700Bold',
} as const;

const INTERLIGNE = 1.25;

function style(taille: number, graisse: 'regular' | 'bold'): TextStyle {
  return {
    fontFamily: polices[graisse],
    fontSize: taille,
    lineHeight: Math.round(taille * INTERLIGNE),
  };
}

/** Styles de texte — docs/design-system.md. Aucun texte en dessous de 16. */
export const typographie = {
  montantGeant: style(44, 'bold'),
  titre: style(30, 'bold'),
  montant: style(28, 'bold'),
  sousTitre: style(22, 'bold'),
  bouton: style(20, 'bold'),
  corpsFort: style(18, 'bold'),
  corps: style(16, 'regular'),
  corpsGrand: style(18, 'regular'),
  libelle: style(16, 'bold'),
  capture: style(14, 'regular'),
} as const;

export type StyleTexte = keyof typeof typographie;
