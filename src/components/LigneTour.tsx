import { Pressable, StyleSheet, View } from 'react-native';

import { couleurs, espacements } from '@/theme';

import { Texte } from './Texte';

type Props = {
  numero: number;
  prenom: string;
  /** Période du tour, déjà formatée (ex. « Janv. 2027 »). */
  periode: string;
  onLongPress?: () => void;
};

/** Ligne de l'ordre des tours : numéro → membre → mois. */
export function LigneTour({ numero, prenom, periode, onLongPress }: Props) {
  return (
    <Pressable onLongPress={onLongPress} disabled={!onLongPress} style={styles.ligne}>
      <View style={styles.numero}>
        <Texte variante="corpsFort">{numero}</Texte>
      </View>
      <Texte variante="corpsFort" style={styles.prenom} numberOfLines={1}>
        {prenom}
      </Texte>
      <Texte couleur="texteSecondaire">{periode}</Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.separateur,
  },
  numero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prenom: { flex: 1 },
});
