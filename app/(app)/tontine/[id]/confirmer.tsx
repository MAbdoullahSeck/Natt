import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BoutonPrincipal, Chargement, Ecran, EnTete, EtatErreur, Texte } from '@/components';
import { useConfirmerPaiement } from '@/data/actions';
import { prenomDe, useTontine } from '@/data/tontine';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatDate, formatMontant } from '@/lib/format';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.confirmer;

/** Écran 14 — Membre · Marquer payé. */
export default function ConfirmerPaiement() {
  const { id, cotisation: cotisationId } = useLocalSearchParams<{
    id: string;
    cotisation: string;
  }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const confirmer = useConfirmerPaiement(id);

  if (isLoading) return <Chargement />;
  const cotisation = data?.cotisations.find((c) => c.id === cotisationId);
  const tour = data?.tours.find((x) => x.id === cotisation?.tour_id);
  if (error || !data || !cotisation || !tour)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.bouton}
          desactive={confirmer.isPending || cotisation.statut === 'paye'}
          onPress={() => confirmer.mutate(cotisation.id, { onSuccess: () => router.back() })}
          testID="bouton-confirmer"
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      <Texte variante="corpsGrand" couleur="texteSecondaire">
        {t.aide}
      </Texte>
      <View style={styles.carte}>
        <Texte variante="sousTitre">{t.de(prenomDe(data.membres, cotisation.membre_id))}</Texte>
        <Texte variante="montantGeant">{formatMontant(data.tontine.montant)}</Texte>
        <Texte>{t.tour(tour.numero, formatDate(tour.echeance))}</Texte>
        <Texte couleur="texteSecondaire">
          {cotisation.declare_at && cotisation.moyen
            ? t.declare(
                textes.moyens[cotisation.moyen as keyof typeof textes.moyens] ?? cotisation.moyen,
                formatDate(cotisation.declare_at),
              )
            : t.pasDeclare}
        </Texte>
      </View>
      {confirmer.error ? (
        <Texte couleur="terracotta">{messageErreur(confirmer.error)}</Texte>
      ) : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayons.carteGrande,
    padding: espacements.xl,
    gap: espacements.s,
  },
});
