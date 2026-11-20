import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { couleurs, espacements, polices, rayons, tailles } from '@/theme';

import { Texte } from './Texte';

type Props = Omit<TextInputProps, 'style'> & {
  /** Préfixe fixe (ex. « +221 »). */
  prefixe?: string;
  /**
   * Affichage seul : la valeur est saisie avec le ClavierNumerique intégré,
   * le clavier système ne s'ouvre pas.
   */
  lectureSeule?: boolean;
};

/** Champ de saisie — hauteur 64, bordure `bordureChamp`, rayon 16. */
export function ChampSaisie({ prefixe, lectureSeule, ...props }: Props) {
  return (
    <View style={styles.champ}>
      {prefixe ? <Texte variante="sousTitre">{prefixe}</Texte> : null}
      <TextInput
        placeholderTextColor={couleurs.texteSecondaire}
        editable={!lectureSeule}
        showSoftInputOnFocus={!lectureSeule}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  champ: {
    minHeight: tailles.champ,
    borderRadius: rayons.champ,
    borderWidth: 1.5,
    borderColor: couleurs.bordureChamp,
    backgroundColor: couleurs.fond,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.m,
    paddingHorizontal: espacements.l,
  },
  input: {
    flex: 1,
    fontFamily: polices.bold,
    fontSize: 22,
    color: couleurs.texte,
    paddingVertical: espacements.m,
  },
});
