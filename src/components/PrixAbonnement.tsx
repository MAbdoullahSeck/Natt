import { StyleSheet, View } from 'react-native';

import {
  moisOfferts,
  type Palier,
  type Periodicite,
  PRIX,
  prixPleinAnnuel,
} from '@/domain/abonnement';
import { textes } from '@/i18n';
import { formatMontant } from '@/lib/format';
import { espacements, rayons } from '@/theme';

import { Texte } from './Texte';

type Props = { palier: Palier; periodicite: Periodicite };

/**
 * Prix d'un palier. En annuel : prix plein barré, prix réel, puis « 2 mois offerts »
 * (~~30 000 F~~ 25 000 F / an).
 */
export function PrixAbonnement({ palier, periodicite }: Props) {
  const t = textes.abonnement;
  const annuel = periodicite === 'annuel';
  const prixPlein = formatMontant(prixPleinAnnuel(palier));
  return (
    <View style={styles.ligne} testID={`prix-${palier}-${periodicite}`}>
      {annuel ? (
        <Texte
          couleur="texteSecondaire"
          style={styles.barre}
          accessibilityLabel={t.auLieuDe(prixPlein)}
          testID="prix-barre"
        >
          {prixPlein}
        </Texte>
      ) : null}
      <Texte variante="corpsFort">
        {formatMontant(PRIX[palier][periodicite])} {t.parPeriode(annuel)}
      </Texte>
      {annuel ? (
        <View style={styles.mention}>
          <Texte variante="libelle" couleur="vert">
            {t.moisOfferts(moisOfferts(palier))}
          </Texte>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacements.s },
  barre: { textDecorationLine: 'line-through' },
  mention: { borderRadius: rayons.puce },
});
