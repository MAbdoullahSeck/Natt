import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { couleurs, espacements, rayons, tailles } from '@/theme';

import { Texte } from './Texte';

type Props = {
  libelle: string;
  onPress?: () => void;
  desactive?: boolean;
  /** Icône à gauche du libellé (chevron par défaut, Figma 2:2). */
  icone?: LucideIcon | null;
  testID?: string;
};

/** Bouton principal — Figma « Bouton principal » (2:2). Une seule action principale par écran. */
export function BoutonPrincipal({
  libelle,
  onPress,
  desactive = false,
  icone: Icone = ChevronRight,
  testID,
}: Props) {
  const couleurTexte = desactive ? 'texteSecondaire' : 'blanc';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desactive }}
      disabled={desactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.bouton,
        desactive && styles.desactive,
        pressed && !desactive && styles.appuye,
      ]}
    >
      {Icone ? <Icone size={tailles.icone} color={couleurs[couleurTexte]} strokeWidth={2} /> : null}
      <Texte variante="bouton" couleur={couleurTexte} numberOfLines={1}>
        {libelle}
      </Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: tailles.bouton,
    borderRadius: rayons.bouton,
    backgroundColor: couleurs.terracotta,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacements.m,
    paddingHorizontal: espacements.l,
  },
  desactive: { backgroundColor: couleurs.desactive },
  appuye: { opacity: 0.85 },
});
