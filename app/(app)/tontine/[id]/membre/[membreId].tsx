import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BoutonPrincipal, Chargement, Ecran, EnTete, EtatErreur, Lien, Texte } from '@/components';
import { useRelancer } from '@/data/reglages';
import { Penalites } from '@/features/tontine/Penalites';
import { messageErreur } from '@/lib/erreurs';
import { BellRing } from 'lucide-react-native';
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
  const relancer = useRelancer(id);

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
  const prenom = prenomDe(d.tousMembres, membreId);
  const estMoi = d.monMembre?.id === membreId;
  return (
    <Ecran
      pied={
        d.estGerante && !estMoi ? (
          <BoutonPrincipal
            libelle={relancer.isSuccess ? textes.relances.envoyee : textes.relances.membre(prenom)}
            icone={BellRing}
            desactive={relancer.isPending || relancer.isSuccess}
            onPress={() => relancer.mutate(membreId)}
            testID="bouton-relancer-membre"
          />
        ) : null
      }
    >
      <EnTete titre={prenom} filAriane={d.tontine.nom} onRetour={() => router.back()} />
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
      {relancer.error ? <Texte couleur="terracotta">{messageErreur(relancer.error)}</Texte> : null}
      <Penalites tontineId={id} membreId={membreId} gerante={d.estGerante} />
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
      {d.estGerante && !estMoi && d.membres.some((m) => m.id === membreId) ? (
        <Lien
          libelle={textes.retrait.lien(prenom)}
          onPress={() =>
            router.push({ pathname: '/tontine/[id]/retirer', params: { id, membre: membreId } })
          }
          testID="lien-retirer"
        />
      ) : null}
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
