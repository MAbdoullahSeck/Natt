import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Crown, Gem, Info, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CarteInfo, Ecran, EnTete, OptionSelection, PrixAbonnement, Texte } from '@/components';
import { usePalierActif } from '@/data/abonnement';
import { cles } from '@/data/cles';
import { type Palier, PALIERS, type Periodicite, palierSuperieur } from '@/domain/abonnement';
import { textes } from '@/i18n';
import { formatDate } from '@/lib/format';
import { useProfil } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { couleurs, espacements, rayons, tailles } from '@/theme';

const t = textes.abonnement;
const ICONES = { starter: Star, pro: Gem, illimite: Crown };

/**
 * Écrans 20 et 21 — Abonnement (palier, prix, statut). Aucun bouton ni lien de paiement dans l'app
 * (règles du Play Store) : le lien PayTech est envoyé hors de l'app (notification push).
 */
export default function Abonnement() {
  const params = useLocalSearchParams<{
    palier?: Palier;
    paiement?: 'succes' | 'annule' | 'erreur';
  }>();
  const profil = useProfil();
  const client = useQueryClient();
  const { palier: actuel, data: abonnements } = usePalierActif();
  const actif = abonnements?.find((a) => a.statut === 'actif' && a.palier === actuel);
  const [periodicite, setPeriodicite] = useState<Periodicite>(
    actif?.periodicite === 'annuel' ? 'annuel' : 'mensuel',
  );

  // B3 : limite atteinte → le lien vers le palier supérieur est envoyé par notification (une fois par jour).
  useQuery({
    queryKey: ['lien-palier-superieur', params.palier],
    enabled: !!params.palier,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('demander_lien_palier_superieur');
      if (error) throw error;
      client.invalidateQueries({ queryKey: cles.notifications });
      return data;
    },
    staleTime: Infinity,
  });

  // Retour de PayTech (natt://abonnement?paiement=…) : on rafraîchit l'abonnement.
  useEffect(() => {
    if (params.paiement === 'succes') client.invalidateQueries({ queryKey: cles.abonnements });
  }, [params.paiement, client]);

  return (
    <Ecran>
      <EnTete
        titre={t.titre}
        onRetour={() => (router.canGoBack() ? router.back() : router.replace('/profil'))}
      />
      {params.paiement ? (
        <CarteInfo icone={Info}>
          {t.retourPaiement[params.paiement] ?? t.retourPaiement.erreur}
        </CarteInfo>
      ) : null}
      {params.palier ? (
        <CarteInfo icone={Info}>
          {!actuel
            ? t.upsellSansAbonnement
            : actuel === 'illimite'
              ? t.upsellMax
              : t.upsell(t.paliers[palierSuperieur(actuel)])}
        </CarteInfo>
      ) : null}

      <View style={styles.statut} testID="statut-abonnement">
        <Texte variante="corpsFort" couleur="texteSecondaire">
          {t.actuel}
        </Texte>
        <Texte variante="sousTitre">
          {actuel && actif?.expire_at
            ? t.actifJusquau(t.paliers[actuel], formatDate(actif.expire_at, { annee: true }))
            : actuel
              ? t.paliers[actuel]
              : t.aucun}
        </Texte>
        {!actuel ? <Texte couleur="texteSecondaire">{t.aucunTexte}</Texte> : null}
        {profil.fondatrice ? <Texte couleur="vert">{t.fondatrice}</Texte> : null}
      </View>

      <View style={styles.onglets}>
        {(['mensuel', 'annuel'] as const).map((p) => (
          <View key={p} style={styles.flex}>
            <OptionSelection
              titre={p === 'mensuel' ? t.mensuel : t.annuel}
              sousTitre={p === 'annuel' ? t.deuxMoisOfferts : undefined}
              selectionne={periodicite === p}
              onPress={() => setPeriodicite(p)}
              testID={`periodicite-${p}`}
            />
          </View>
        ))}
      </View>

      {PALIERS.map((p) => {
        const Icone = ICONES[p];
        const estActuel = p === actuel;
        return (
          <View
            key={p}
            style={[styles.offre, estActuel && styles.offreActuelle]}
            testID={`offre-${p}`}
          >
            <Icone
              size={tailles.icone}
              color={estActuel ? couleurs.terracotta : couleurs.texte}
              strokeWidth={2}
            />
            <View style={styles.flex}>
              <Texte variante="sousTitre">{t.paliers[p]}</Texte>
              <Texte couleur="texteSecondaire">{t.limites[p]}</Texte>
              <PrixAbonnement palier={p} periodicite={periodicite} />
            </View>
            {estActuel ? (
              <Texte variante="libelle" couleur="vert">
                ✓
              </Texte>
            ) : null}
          </View>
        );
      })}
      <Texte couleur="texteSecondaire">{t.commentPayer}</Texte>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  statut: {
    backgroundColor: couleurs.terracottaClair,
    borderRadius: rayons.carteGrande,
    padding: espacements.xl,
    gap: espacements.s,
  },
  onglets: { flexDirection: 'row', gap: espacements.m },
  flex: { flex: 1 },
  offre: {
    flexDirection: 'row',
    gap: espacements.l,
    padding: espacements.l,
    borderRadius: rayons.carte,
    borderWidth: 1.5,
    borderColor: couleurs.bordure,
  },
  offreActuelle: { borderColor: couleurs.terracotta, backgroundColor: couleurs.terracottaClair },
});
