import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Chargement, Ecran, EnTete, EtatErreur, Texte } from '@/components';
import { prenomDe, useEvenementsMembre, useTontine } from '@/data/tontine';
import { bilanMembre } from '@/domain/tontine';
import { libelleEvenement } from '@/features/tontine/evenements';
import { textes } from '@/i18n';
import { formatDate, formatHeure } from '@/lib/format';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.historique;

/** Écran 13c — Membre · Historique (bilan + événements horodatés). */
export default function HistoriqueMembre() {
  const { id, membreId } = useLocalSearchParams<{ id: string; membreId: string }>();
  const tontine = useTontine(id);
  const evenements = useEvenementsMembre(id, membreId);

  if (tontine.isLoading || evenements.isLoading) return <Chargement />;
  if (tontine.error || evenements.error || !tontine.data)
    return (
      <Ecran>
        <EnTete titre={t.titreListe} onRetour={() => router.back()} />
        <EtatErreur
          erreur={tontine.error ?? evenements.error}
          onReessayer={() => {
            tontine.refetch();
            evenements.refetch();
          }}
        />
      </Ecran>
    );

  const d = tontine.data;
  const bilan = bilanMembre(d.tours, d.cotisations, membreId);
  return (
    <Ecran>
      <EnTete
        titre={prenomDe(d.membres, membreId)}
        filAriane={d.tontine.nom}
        onRetour={() => router.back()}
      />
      <View style={styles.bilan}>
        <View style={[styles.case, { backgroundColor: couleurs.vertPuce }]}>
          <Texte variante="sousTitre" couleur="vert">
            {t.aLHeure(bilan.aLHeure)}
          </Texte>
        </View>
        <View style={[styles.case, { backgroundColor: couleurs.terracottaPuce }]}>
          <Texte variante="sousTitre" couleur="terracotta">
            {t.enRetard(bilan.enRetard)}
          </Texte>
        </View>
      </View>
      <Texte variante="sousTitre">{t.titreListe}</Texte>
      {(evenements.data ?? []).length === 0 ? <Texte>{t.vide}</Texte> : null}
      {(evenements.data ?? []).map((e) => (
        <View key={e.id} style={styles.ligne}>
          <Texte variante="corpsFort">{libelleEvenement(e)}</Texte>
          <Texte couleur="texteSecondaire">
            {t.quand(formatDate(e.created_at, { annee: true }), formatHeure(e.created_at))}
          </Texte>
        </View>
      ))}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  bilan: { flexDirection: 'row', gap: espacements.m },
  case: { flex: 1, borderRadius: rayons.carte, padding: espacements.l },
  ligne: {
    paddingVertical: espacements.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.separateur,
    gap: espacements.xs,
  },
});
