import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { creerStyles, espacements, rayons, tailles, useCouleurs } from '@/theme';

import { Texte } from './Texte';

type Props = {
  libelle: string;
  onPress?: () => void;
  icone?: LucideIcon;
  desactive?: boolean;
  testID?: string;
};

/** Bouton secondaire — Figma « Bouton secondaire » (2:7) : fond de l'écran, bordure `bordureBoutonSecondaire`. */
export function BoutonSecondaire({ libelle, onPress, icone: Icone, desactive, testID }: Props) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desactive }}
      disabled={desactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.bouton,
        pressed && styles.appuye,
        desactive && styles.desactive,
      ]}
    >
      {Icone ? <Icone size={tailles.icone} color={couleurs.texte} strokeWidth={2} /> : null}
      <Texte variante="corpsFort" numberOfLines={1}>
        {libelle}
      </Texte>
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bouton: {
    minHeight: tailles.bouton,
    borderRadius: rayons.bouton,
    backgroundColor: couleurs.fond,
    borderWidth: 1,
    borderColor: couleurs.bordureBoutonSecondaire,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacements.m,
    paddingHorizontal: espacements.l,
  },
  appuye: { backgroundColor: couleurs.surface },
  desactive: { opacity: 0.5 },
}));
