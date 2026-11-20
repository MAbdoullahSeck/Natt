import { Pressable } from 'react-native';

import { tailles } from '@/theme';

import { Texte } from './Texte';

type Props = { libelle: string; onPress?: () => void; desactive?: boolean; testID?: string };

/** Lien texte terracotta (zone tactile de 48). */
export function Lien({ libelle, onPress, desactive, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      disabled={desactive}
      hitSlop={8}
      style={{ minHeight: tailles.zoneTactile, justifyContent: 'center' }}
      testID={testID}
    >
      <Texte variante="corpsFort" couleur={desactive ? 'texteSecondaire' : 'terracotta'}>
        {libelle}
      </Texte>
    </Pressable>
  );
}
