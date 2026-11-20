import { StyleSheet, View } from 'react-native';

import { Lien, Texte } from '@/components';
import { useAnnulerPenalite, useEvenementsPenalites } from '@/data/reglages';
import { penalitesDuMembre, totalPenalites } from '@/domain/notifications';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatMontant } from '@/lib/format';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.penalites;

type Props = { tontineId: string; membreId: string; gerante: boolean };

/** P5 : pénalités d'un membre, affichées au membre et à la gérante (qui peut les annuler). */
export function Penalites({ tontineId, membreId, gerante }: Props) {
  const { data } = useEvenementsPenalites(tontineId);
  const annuler = useAnnulerPenalite(tontineId);
  const penalites = penalitesDuMembre(data ?? [], membreId);
  if (penalites.length === 0) return null;
  const total = totalPenalites(penalites);

  return (
    <View style={styles.bloc}>
      <Texte variante="corpsFort">{gerante ? t.titre : t.total(formatMontant(total))}</Texte>
      {penalites.map((p) => (
        <View key={p.id} style={styles.ligne}>
          <Texte style={styles.flex} couleur={p.annulee ? 'texteSecondaire' : 'terracotta'}>
            {t.ligne(formatMontant(p.montant), p.tour)}
          </Texte>
          {p.annulee ? (
            <Texte couleur="texteSecondaire">{t.annulee}</Texte>
          ) : gerante ? (
            <Lien
              libelle={t.annuler}
              onPress={() => annuler.mutate(p.id)}
              desactive={annuler.isPending}
            />
          ) : null}
        </View>
      ))}
      {annuler.error ? <Texte couleur="terracotta">{messageErreur(annuler.error)}</Texte> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: {
    gap: espacements.s,
    padding: espacements.l,
    borderRadius: rayons.carte,
    backgroundColor: couleurs.terracottaPuce,
  },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espacements.m, minHeight: 48 },
  flex: { flex: 1 },
});
