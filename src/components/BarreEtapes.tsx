import { View } from 'react-native';

import { textes } from '@/i18n';
import { creerStyles, espacements } from '@/theme';

type Props = { etape: number; total?: number };

/** Barre de progression du parcours de création (6 segments). */
export function BarreEtapes({ etape, total = 6 }: Props) {
  const styles = useStyles();
  return (
    <View
      style={styles.barre}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={textes.etapes.progression(etape, total)}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segment, i < etape && styles.atteint]} />
      ))}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  barre: { flexDirection: 'row', gap: espacements.s },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: couleurs.separateur },
  atteint: { backgroundColor: couleurs.terracotta },
}));
