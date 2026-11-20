import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { FileBarChart, PartyPopper } from 'lucide-react-native';
import { View } from 'react-native';

import {
  BoutonPrincipal,
  BoutonSecondaire,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  Texte,
} from '@/components';
import { useTontine } from '@/data/tontine';
import { textes } from '@/i18n';
import { formatMontant } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { creerStyles, tailles, useCouleurs } from '@/theme';

const t = textes.finCycle;

/** Écran 19 — Fin de cycle (gérante). */
export default function FinDeCycle() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const suivant = useQuery({
    queryKey: ['cycle-suivant', id],
    queryFn: async () => {
      const { data: s } = await supabase
        .from('tontines')
        .select('id')
        .eq('cycle_precedent_id', id)
        .maybeSingle();
      return s;
    },
  });

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  const tt = data.tontine;
  const nbVerses = data.tours.filter((x) => x.verse_at).length;
  const dejaRelance = !!suivant.data;

  return (
    <Ecran
      pied={
        <>
          <BoutonSecondaire
            libelle={t.voirRapport}
            icone={FileBarChart}
            onPress={() => router.push({ pathname: '/tontine/[id]/rapport', params: { id } })}
            testID="bouton-rapport"
          />
          {data.estGerante && !dejaRelance ? (
            <BoutonPrincipal
              libelle={t.relancer}
              onPress={() => router.push({ pathname: '/tontine/[id]/relancer', params: { id } })}
              testID="bouton-relancer-cycle"
            />
          ) : null}
        </>
      }
    >
      <View style={styles.centre}>
        <View style={styles.rond}>
          <PartyPopper size={tailles.icone * 2} color={couleurs.vert} strokeWidth={2} />
        </View>
      </View>
      <EnTete titre={t.titre} filAriane={tt.nom} onRetour={() => router.back()} />
      <Texte variante="corpsGrand">
        {tt.type === 'achat_groupe' && tt.bien_prevu
          ? t.bilanAchat(nbVerses, tt.bien_prevu)
          : t.bilan(nbVerses, formatMontant(nbVerses * tt.montant * tt.nb_membres))}
      </Texte>
      {dejaRelance ? <Texte couleur="texteSecondaire">{t.dejaRelance}</Texte> : null}
    </Ecran>
  );
}

const useStyles = creerStyles((couleurs) => ({
  centre: { alignItems: 'center' },
  rond: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: couleurs.vertPuce,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
