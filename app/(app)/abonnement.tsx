import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { Crown, Gem, Star } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BoutonPrincipal,
  BoutonSecondaire,
  CarteInfo,
  Ecran,
  EnTete,
  OptionSelection,
  Texte,
} from '@/components';
import { config } from '@/config';
import { usePalierActif } from '@/data/abonnement';
import { cles } from '@/data/cles';
import { type Palier, PALIERS, type Periodicite, PRIX } from '@/domain/abonnement';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatDate, formatMontant } from '@/lib/format';
import { useProfil } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { espacements, rayons } from '@/theme';

const t = textes.abonnement;
const ICONES = { starter: Star, pro: Gem, illimite: Crown };

/** Écrans 20 et 21 — Abonnement mensuel / annuel (B1–B5). */
export default function Abonnement() {
  const params = useLocalSearchParams<{ palier?: Palier }>();
  const profil = useProfil();
  const client = useQueryClient();
  const { palier: actuel, data: abonnements } = usePalierActif();
  const enAttente = abonnements?.find((a) => a.statut === 'en_attente');
  const actif = abonnements?.find((a) => a.statut === 'actif' && a.palier === actuel);
  const [periodicite, setPeriodicite] = useState<Periodicite>('mensuel');
  const [choix, setChoix] = useState<Palier>(params.palier ?? actuel ?? 'starter');
  const [copie, setCopie] = useState(false);

  const demander = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('demander_abonnement', {
        p_palier: choix,
        p_periodicite: periodicite,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: cles.abonnements }),
  });

  const annuel = periodicite === 'annuel';
  const montantChoisi = formatMontant(PRIX[choix][periodicite]);

  if (demander.isSuccess) {
    return (
      <Ecran pied={<BoutonPrincipal libelle={t.demande.terminer} onPress={() => router.back()} />}>
        <EnTete titre={t.demande.titre} onRetour={() => router.back()} />
        <Texte variante="corpsGrand">{t.demande.texte(montantChoisi, config.numeroWaveNatt)}</Texte>
        {config.numeroWaveNatt ? (
          <BoutonSecondaire
            libelle={copie ? t.demande.copie : t.demande.copier}
            onPress={() =>
              Clipboard.setStringAsync(config.numeroWaveNatt).then(() => setCopie(true))
            }
          />
        ) : null}
      </Ecran>
    );
  }

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.choisir(t.paliers[choix])}
          desactive={demander.isPending || (choix === actuel && !params.palier)}
          onPress={() => demander.mutate()}
          testID="bouton-choisir-palier"
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      {params.palier ? <CarteInfo>{t.upsell}</CarteInfo> : null}
      <View style={styles.onglets}>
        {(['mensuel', 'annuel'] as const).map((p) => (
          <View key={p} style={styles.flex}>
            <OptionSelection
              titre={p === 'mensuel' ? t.mensuel : t.annuel}
              sousTitre={p === 'annuel' ? t.deuxMoisOfferts : undefined}
              selectionne={periodicite === p}
              onPress={() => setPeriodicite(p)}
            />
          </View>
        ))}
      </View>
      {PALIERS.map((p) => (
        <View key={p}>
          <OptionSelection
            icone={ICONES[p]}
            titre={`${t.paliers[p]} · ${t.prix(formatMontant(PRIX[p][periodicite]), annuel)}`}
            sousTitre={t.limites[p]}
            selectionne={choix === p}
            onPress={() => setChoix(p)}
            testID={`palier-${p}`}
          />
          {p === actuel ? (
            <Texte variante="libelle" couleur="vert" style={styles.mention}>
              ✓ {t.actuel}
              {actif?.expire_at
                ? ` · ${t.expire(formatDate(actif.expire_at, { annee: true }))}`
                : ''}
            </Texte>
          ) : null}
          {enAttente?.palier === p ? (
            <Texte variante="libelle" couleur="texteSecondaire" style={styles.mention}>
              {t.enAttente}
            </Texte>
          ) : null}
        </View>
      ))}
      {profil.fondatrice ? <Texte couleur="vert">{t.fondatrice}</Texte> : null}
      <Texte couleur="texteSecondaire">{t.rejoindreGratuit}</Texte>
      {demander.error ? <Texte couleur="terracotta">{messageErreur(demander.error)}</Texte> : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  onglets: { flexDirection: 'row', gap: espacements.m },
  flex: { flex: 1 },
  mention: {
    marginTop: espacements.xs,
    paddingHorizontal: espacements.l,
    borderRadius: rayons.puce,
  },
});
