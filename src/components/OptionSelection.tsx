import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { couleurs, espacements, rayons, tailles } from '@/theme';

import { Texte } from './Texte';

type Props = {
  titre: string;
  sousTitre?: string;
  icone?: LucideIcon;
  selectionne: boolean;
  onPress: () => void;
  testID?: string;
};

/** Option à choix unique : icône, titre, sous-titre, rond de sélection. */
export function OptionSelection({
  titre,
  sousTitre,
  icone: Icone,
  selectionne,
  onPress,
  testID,
}: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: selectionne, checked: selectionne }}
      onPress={onPress}
      testID={testID}
      style={[styles.option, selectionne && styles.selectionnee]}
    >
      {Icone ? (
        <Icone
          size={tailles.icone}
          color={selectionne ? couleurs.terracotta : couleurs.texte}
          strokeWidth={2}
        />
      ) : null}
      <View style={styles.textes}>
        <Texte variante="sousTitre">{titre}</Texte>
        {sousTitre ? <Texte couleur="texteSecondaire">{sousTitre}</Texte> : null}
      </View>
      <View style={[styles.rond, selectionne && styles.rondSelectionne]}>
        {selectionne ? <View style={styles.point} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 80,
    borderRadius: rayons.carte,
    borderWidth: 1.5,
    borderColor: couleurs.bordure,
    backgroundColor: couleurs.fond,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.l,
    padding: espacements.l,
  },
  selectionnee: { borderColor: couleurs.terracotta, backgroundColor: couleurs.terracottaClair },
  textes: { flex: 1, gap: espacements.xs },
  rond: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: couleurs.bordureChamp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rondSelectionne: { borderColor: couleurs.terracotta },
  point: { width: 12, height: 12, borderRadius: 6, backgroundColor: couleurs.terracotta },
});
