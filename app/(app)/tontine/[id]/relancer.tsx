import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { BoutonPrincipal, ChoixDate, Ecran, EnTete, Texte } from '@/components';
import { usePalierActif } from '@/data/abonnement';
import { cles } from '@/data/cles';
import { palierSuperieur } from '@/domain/abonnement';
import { jour, versISO } from '@/domain/dates';
import { textes } from '@/i18n';
import { codeErreur, messageErreur } from '@/lib/erreurs';
import { supabase } from '@/lib/supabase';

const t = textes.finCycle.relance;

/** F3 — Relancer le cycle : date de début du nouveau cycle, puis code à partager (écran 11). */
export default function RelancerCycle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useQueryClient();
  const { palier } = usePalierActif();
  const [date, setDate] = useState(() => jour(new Date()));

  const relancer = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('relancer_cycle', {
        p_tontine_id: id,
        p_date_debut: versISO(date),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (nouvelle) => {
      client.invalidateQueries({ queryKey: cles.mesTontines });
      router.dismissAll();
      router.push({ pathname: '/creer/cree', params: { id: nouvelle.id } });
    },
    onError: (e) => {
      if (codeErreur(e) === 'limite_atteinte')
        router.push({ pathname: '/abonnement', params: { palier: palierSuperieur(palier) } });
    },
  });

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.bouton}
          desactive={relancer.isPending}
          onPress={() => relancer.mutate()}
          testID="bouton-confirmer-relance"
        />
      }
    >
      <EnTete titre={t.titre} onRetour={() => router.back()} />
      <Texte couleur="texteSecondaire">{t.aide}</Texte>
      <ChoixDate valeur={date} minimum={jour(new Date())} onChange={(d) => setDate(jour(d))} />
      {relancer.error && codeErreur(relancer.error) !== 'limite_atteinte' ? (
        <Texte couleur="terracotta">{messageErreur(relancer.error)}</Texte>
      ) : null}
    </Ecran>
  );
}
