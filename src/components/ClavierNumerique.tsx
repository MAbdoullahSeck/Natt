import { Delete } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { textes } from '@/i18n';
import { couleurs, espacements, rayons, tailles } from '@/theme';

import { Texte } from './Texte';

type Props = {
  onChiffre: (chiffre: string) => void;
  onEffacer: () => void;
};

const RANGEES = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

/** Pavé numérique intégré — Figma « Clavier numérique » (2:13). */
export function ClavierNumerique({ onChiffre, onEffacer }: Props) {
  return (
    <View style={styles.clavier}>
      {RANGEES.map((rangee) => (
        <View key={rangee[0]} style={styles.rangee}>
          {rangee.map((c) => (
            <Touche key={c} chiffre={c} onPress={() => onChiffre(c)} />
          ))}
        </View>
      ))}
      <View style={styles.rangee}>
        <View style={styles.vide} />
        <Touche chiffre="0" onPress={() => onChiffre('0')} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textes.commun.effacer}
          onPress={onEffacer}
          style={({ pressed }) => [styles.touche, pressed && styles.appuye]}
          testID="touche-effacer"
        >
          <Delete size={tailles.icone} color={couleurs.texte} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

function Touche({ chiffre, onPress }: { chiffre: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={textes.clavier.chiffre(chiffre)}
      onPress={onPress}
      style={({ pressed }) => [styles.touche, pressed && styles.appuye]}
      testID={`touche-${chiffre}`}
    >
      <Texte variante="montant">{chiffre}</Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clavier: { gap: espacements.s },
  rangee: { flexDirection: 'row', gap: espacements.m },
  touche: {
    flex: 1,
    height: tailles.touche,
    borderRadius: rayons.touche,
    backgroundColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vide: { flex: 1, height: tailles.touche },
  appuye: { backgroundColor: couleurs.desactive },
});
