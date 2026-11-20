import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Info, Smartphone } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import {
  BoutonPrincipal,
  CarteInfo,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  Lien,
  OptionSelection,
  Texte,
} from '@/components';
import { cles } from '@/data/cles';
import { useTontine } from '@/data/tontine';
import { formatTelephoneComplet } from '@/domain/telephone';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatMontant } from '@/lib/format';
import { type Moyen, MOYENS, numeroPourPaiement, ouvrirPaiement } from '@/lib/paiementMobile';
import { supabase } from '@/lib/supabase';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.paiement;

/** Écran 17 — Paiement · Choisir. L'argent va directement du membre à la gérante. */
export default function Payer() {
  const { id, cotisation } = useLocalSearchParams<{ id: string; cotisation: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const client = useQueryClient();
  const [moyen, setMoyen] = useState<Moyen>('wave');
  const [copie, setCopie] = useState(false);
  const enAttenteDuRetour = useRef(false);

  const declarer = useMutation({
    mutationFn: async (m: Moyen) => {
      const { error } = await supabase.rpc('declarer_paiement', {
        p_cotisation_id: cotisation,
        p_moyen: m,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: cles.tontine(id) });
      client.invalidateQueries({ queryKey: cles.mesTontines });
      router.replace({ pathname: '/tontine/[id]/paiement-envoye', params: { id, cotisation } });
    },
  });

  // P2 : au retour de Wave / Orange Money, la cotisation passe en « déclaré » et l'écran 18 s'affiche.
  useEffect(() => {
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active' && enAttenteDuRetour.current) {
        enAttenteDuRetour.current = false;
        declarer.mutate(moyen);
      }
    });
    return () => abonnement.remove();
  }, [declarer, moyen]);

  if (isLoading) return <Chargement />;
  const gerante = data?.membres.find((m) => m.profil_id === data.tontine.gerante_id);
  if (error || !data || !gerante?.profil)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  const telephone = gerante.profil.telephone;
  const prenomGerante = gerante.profil.prenom;

  async function payer() {
    enAttenteDuRetour.current = true;
    const resultat = await ouvrirPaiement(moyen, telephone);
    if (resultat === 'copie_seulement') {
      enAttenteDuRetour.current = false;
      setCopie(true);
    }
  }

  return (
    <Ecran
      pied={
        <>
          <BoutonPrincipal
            libelle={t.payerAvec(textes.moyens[moyen])}
            icone={Smartphone}
            desactive={declarer.isPending}
            onPress={payer}
            testID="bouton-payer-avec"
          />
          <View style={styles.centre}>
            <Lien
              libelle={t.dejaPaye}
              onPress={() => declarer.mutate(moyen)}
              desactive={declarer.isPending}
              testID="lien-deja-paye"
            />
          </View>
        </>
      }
    >
      <EnTete titre={t.titre} filAriane={data.tontine.nom} onRetour={() => router.back()} />
      <View style={styles.carte}>
        <Texte variante="corpsFort" couleur="texteSecondaire">
          {t.montant}
        </Texte>
        <Texte variante="montantGeant">{formatMontant(data.tontine.montant)}</Texte>
        <Texte variante="corpsFort">{t.a(prenomGerante)}</Texte>
        <Texte>{formatTelephoneComplet(telephone)}</Texte>
      </View>
      <Texte variante="corpsFort">{t.choisir}</Texte>
      {MOYENS.map((m) => (
        <OptionSelection
          key={m}
          icone={Smartphone}
          titre={textes.moyens[m]}
          selectionne={moyen === m}
          onPress={() => setMoyen(m)}
          testID={`moyen-${m}`}
        />
      ))}
      <CarteInfo icone={Info}>{t.directement(prenomGerante)}</CarteInfo>
      {copie ? (
        <Texte variante="corpsFort" couleur="vert">
          {t.numeroCopie(numeroPourPaiement(telephone))}
        </Texte>
      ) : null}
      {declarer.error ? <Texte couleur="terracotta">{messageErreur(declarer.error)}</Texte> : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.terracottaClair,
    borderRadius: rayons.carteGrande,
    padding: espacements.xl,
    gap: espacements.s,
  },
  centre: { alignItems: 'center' },
});
