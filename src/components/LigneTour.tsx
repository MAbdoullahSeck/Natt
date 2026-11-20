import { Pressable, StyleSheet, View } from 'react-native';

import { couleurs, espacements } from '@/theme';

import { Texte } from './Texte';

type Props = {
  numero: number;
  prenom: string;
  /** Période du tour, déjà formatée (ex. « Janv. 2027 »). */
  periode: string;
  onLongPress?: () => void;
  /** Mention à droite (ex. « Versé »). */
  mention?: string;
};

/** Ligne de l'ordre des tours : numéro → membre → mois. */
export function LigneTour({ numero, prenom, periode, onLongPress, mention }: Props) {
  return (
    <Pressable
      onLongPress={onLongPress}
      disabled={!onLongPress}
      style={styles.ligne}
      accessibilityHint={onLongPress ? 'Appui long pour échanger' : undefined}
    >
      <View style={styles.numero}>
        <Texte variante="corpsFort">{numero}</Texte>
      </View>
      <Texte variante="corpsFort" style={styles.prenom} numberOfLines={1}>
        {prenom}
      </Texte>
      <View style={styles.droite}>
        <Texte couleur="texteSecondaire">{periode}</Texte>
        {mention ? (
          <Texte variante="libelle" couleur="vert">
            {mention}
          </Texte>
        ) : null}
      </View>
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
  droite: { alignItems: 'flex-end' },
});
