import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { couleurs, espacements, rayons, tailles } from '@/theme';

import { Texte } from './Texte';

type Props = {
  libelle: string;
  coche: boolean;
  onChange: (coche: boolean) => void;
  testID?: string;
};

/** Case à cocher (consentement, acceptation du règlement). Jamais cochée par défaut. */
export function CaseACocher({ libelle, coche, onChange, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: coche }}
      onPress={() => onChange(!coche)}
      style={styles.ligne}
      testID={testID}
    >
      <View style={[styles.case, coche && styles.cochee]}>
        {coche ? <Check size={tailles.icone} color={couleurs.blanc} strokeWidth={3} /> : null}
      </View>
      <Texte variante="corpsFort" style={styles.libelle}>
        {libelle}
      </Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    minHeight: tailles.bouton,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.l,
  },
  case: {
    width: 32,
    height: 32,
    borderRadius: rayons.puce,
    borderWidth: 2,
    borderColor: couleurs.bordureChamp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cochee: { backgroundColor: couleurs.terracotta, borderColor: couleurs.terracotta },
  libelle: { flex: 1 },
});
