import { Pressable, View } from 'react-native';

import { creerStyles, espacements, tailles } from '@/theme';

import { Texte } from './Texte';

type Props = {
  libelle: string;
  valeur: boolean;
  onChange: (valeur: boolean) => void;
  testID?: string;
};

/** Ligne avec libellé et interrupteur (réglages des relances). */
export function Interrupteur({ libelle, valeur, onChange, testID }: Props) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={libelle}
      accessibilityState={{ checked: valeur }}
      onPress={() => onChange(!valeur)}
      style={styles.ligne}
      testID={testID}
    >
      <Texte variante="corpsFort" style={styles.libelle}>
        {libelle}
      </Texte>
      <View style={[styles.piste, valeur && styles.pisteActive]}>
        <View style={[styles.pouce, valeur && styles.pouceActif]} />
      </View>
    </Pressable>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: {
    minHeight: tailles.bouton,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.l,
  },
  libelle: { flex: 1 },
  piste: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: couleurs.desactive,
    padding: 3,
  },
  pisteActive: { backgroundColor: couleurs.fondAccent },
  pouce: { width: 26, height: 26, borderRadius: 13, backgroundColor: couleurs.blanc },
  pouceActif: { alignSelf: 'flex-end' },
}));
