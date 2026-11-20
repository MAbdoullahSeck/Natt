import { StyleSheet, View } from 'react-native';

import { type Palier, type Periodicite, PRIX } from '@/domain/abonnement';
import { textes } from '@/i18n';
import { formatMontant } from '@/lib/format';
import { espacements } from '@/theme';

import { Texte } from './Texte';

type Props = { palier: Palier; periodicite: Periodicite };

/** Prix d'un palier (complété au point 3 par le prix barré de l'annuel). */
export function PrixAbonnement({ palier, periodicite }: Props) {
  const annuel = periodicite === 'annuel';
  return (
    <View style={styles.ligne}>
      <Texte variante="corpsFort">
        {formatMontant(PRIX[palier][periodicite])} {textes.abonnement.parPeriode(annuel)}
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: espacements.s },
});
