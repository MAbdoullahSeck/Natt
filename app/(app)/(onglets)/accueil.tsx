import { router } from 'expo-router';
import { Grid3x3, Plus } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BoutonPrincipal,
  BoutonSecondaire,
  CarteTontine,
  Chargement,
  EnTete,
  EtatErreur,
  Texte,
} from '@/components';
import { type LigneMesTontines, useMesTontines } from '@/data/tontines';
import { statutAffiche, type StatutAffiche } from '@/domain/statuts';
import { textes } from '@/i18n';
import { couleurs, espacements } from '@/theme';

const t = textes.accueil;

function statutCarte(l: LigneMesTontines): StatutAffiche {
  if (l.statut === 'terminee' || !l.ma_cotisation_statut || !l.tour_echeance) return 'paye';
  return statutAffiche(
    { statut: l.ma_cotisation_statut, declareAt: l.ma_declare_at, payeAt: l.ma_paye_at },
    l.tour_echeance,
  );
}

/** Écrans 05 et 05b — Accueil (liste ou vide). */
export default function Accueil() {
  const { data, isLoading, error, refetch, isRefetching } = useMesTontines();

  const actions = (
    <View style={styles.actions}>
      <BoutonPrincipal
        libelle={t.creerTontine}
        icone={Plus}
        onPress={() => router.push('/creer/nom')}
        testID="bouton-creer"
      />
      <BoutonSecondaire
        libelle={t.rejoindreAvecCode}
        icone={Grid3x3}
        onPress={() => router.push('/rejoindre')}
        testID="bouton-rejoindre"
      />
    </View>
  );

  let contenu;
  if (isLoading) contenu = <Chargement />;
  else if (error) contenu = <EtatErreur erreur={error} onReessayer={refetch} />;
  else if (!data || data.length === 0)
    contenu = (
      <View style={styles.vide}>
        <Texte variante="sousTitre" centre>
          {t.vide.titre}
        </Texte>
        <Texte variante="corpsGrand" couleur="texteSecondaire" centre>
          {t.vide.texte}
        </Texte>
      </View>
    );
  else
    contenu = data.map((l) => (
      <CarteTontine
        key={l.id}
        nom={l.nom}
        montant={l.montant}
        statut={statutCarte(l)}
        bienPrevu={l.bien_prevu}
        details={t.details(
          l.est_gerante ? t.toi : l.gerante_prenom,
          t.membres(l.nb_membres),
          textes.frequences[l.frequence],
        )}
        onPress={() => router.push({ pathname: '/tontine/[id]', params: { id: l.id } })}
      />
    ));

  return (
    <SafeAreaView style={styles.ecran} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contenu}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={couleurs.terracotta}
          />
        }
      >
        <EnTete titre={t.titre} />
        {contenu}
        {actions}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.marge, gap: espacements.l, flexGrow: 1 },
  actions: { gap: espacements.m, marginTop: espacements.s },
  vide: { gap: espacements.m, paddingVertical: espacements.xxl },
});
