import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BoutonPrincipal,
  CaseACocher,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  LigneInfo,
  Texte,
} from '@/components';
import { cles } from '@/data/cles';
import { chargerApercu } from '@/data/rejoindre';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatDate, formatMontant } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.rejoindre.reglement;

/** Écran 12c — aperçu + règlement ; acceptation obligatoire avant de rejoindre. */
export default function ReglementRejoindre() {
  const { code = '' } = useLocalSearchParams<{ code: string }>();
  const client = useQueryClient();
  const [accepte, setAccepte] = useState(false);
  const apercu = useQuery({ queryKey: ['apercu', code], queryFn: () => chargerApercu(code) });

  const rejoindre = useMutation({
    mutationFn: async (version: number) => {
      const { data, error } = await supabase.rpc('rejoindre_tontine', {
        p_code: code,
        p_version_reglement: version,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (id) => {
      client.invalidateQueries({ queryKey: cles.mesTontines });
      router.dismissAll();
      router.replace({ pathname: '/tontine/[id]', params: { id } });
    },
    onError: () => apercu.refetch(),
  });

  if (apercu.isLoading) return <Chargement />;
  if (apercu.error || !apercu.data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={apercu.error} onReessayer={apercu.refetch} />
      </Ecran>
    );

  const a = apercu.data;
  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.bouton}
          desactive={!accepte || rejoindre.isPending}
          onPress={() => rejoindre.mutate(a.reglement_version)}
          testID="bouton-rejoindre-tontine"
        />
      }
    >
      <EnTete titre={a.nom} filAriane={t.titre} onRetour={() => router.back()} />
      <View>
        <LigneInfo libelle={t.montant} valeur={formatMontant(a.montant)} />
        <LigneInfo libelle={t.frequence} valeur={textes.frequences[a.frequence]} />
        <LigneInfo libelle={t.membres} valeur={t.membresValeur(a.nb_inscrits, a.nb_membres)} />
        <LigneInfo libelle={t.gerante} valeur={a.gerante_prenom} />
        {a.bien_prevu ? <LigneInfo libelle={t.bien} valeur={a.bien_prevu} /> : null}
        <LigneInfo libelle={t.premierTour} valeur={formatDate(a.date_debut, { annee: true })} />
        <LigneInfo libelle={t.ordre} valeur={a.ordre_tirage ? t.ordreTirage : t.ordreArrivee} />
      </View>
      <View style={styles.reglement}>
        <Texte variante="corpsFort">{t.regles}</Texte>
        {a.reglement_lignes.map((ligne, i) => (
          <Texte key={i}>• {ligne}</Texte>
        ))}
      </View>
      <CaseACocher
        libelle={t.accepter}
        coche={accepte}
        onChange={setAccepte}
        testID="case-reglement"
      />
      {rejoindre.error ? (
        <Texte couleur="terracotta">{messageErreur(rejoindre.error)}</Texte>
      ) : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  reglement: {
    gap: espacements.s,
    padding: espacements.l,
    borderRadius: rayons.carte,
    backgroundColor: couleurs.terracottaClair,
  },
});
