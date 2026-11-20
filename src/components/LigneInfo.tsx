import { View } from 'react-native';

import { creerStyles, espacements } from '@/theme';

import { Texte } from './Texte';

type Props = { libelle: string; valeur: string };

/** Ligne « libellé … valeur » d'un récapitulatif (aperçu, rapport). */
export function LigneInfo({ libelle, valeur }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.ligne}>
      <Texte couleur="texteSecondaire" style={styles.libelle}>
        {libelle}
      </Texte>
      <Texte variante="corpsFort" style={styles.valeur}>
        {valeur}
      </Texte>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: {
    flexDirection: 'row',
    gap: espacements.m,
    paddingVertical: espacements.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.separateur,
  },
  libelle: { flex: 1 },
  valeur: { flexShrink: 1, textAlign: 'right' },
}));
