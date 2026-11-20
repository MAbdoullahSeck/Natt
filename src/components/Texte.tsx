import { Text, type TextProps } from 'react-native';

import { couleurs, typographie, type Couleur, type StyleTexte } from '@/theme';

export type TexteProps = TextProps & {
  variante?: StyleTexte;
  couleur?: Couleur;
  centre?: boolean;
};

/** Texte Nunito avec les styles du design system. */
export function Texte({
  variante = 'corps',
  couleur = 'texte',
  centre,
  style,
  ...props
}: TexteProps) {
  return (
    <Text
      style={[
        typographie[variante],
        { color: couleurs[couleur] },
        centre && { textAlign: 'center' },
        style,
      ]}
      maxFontSizeMultiplier={1.5}
      {...props}
    />
  );
}
