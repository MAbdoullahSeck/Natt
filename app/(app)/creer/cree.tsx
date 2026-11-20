import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { BoutonPrincipal, Chargement, Ecran, EnTete, EtatErreur, Lien, Texte } from '@/components';
import { textes } from '@/i18n';
import { formatDate, formatMontant } from '@/lib/format';
import { lienInvitation } from '@/lib/invitation';
import { partagerWhatsApp } from '@/lib/partage';
import { supabase } from '@/lib/supabase';
import { creerStyles, espacements, rayons, tailles, useCouleurs } from '@/theme';

const t = textes.creation.cree;

/** Écran 11 — Tontine créée : code d'invitation, récapitulatif, partage WhatsApp. */
export default function TontineCreee() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tontine-creee', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tontines').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  return (
    <Ecran
      pied={
        <>
          <BoutonPrincipal
            libelle={t.partager}
            onPress={() =>
              partagerWhatsApp(t.message(data.nom, data.code, lienInvitation(data.code)))
            }
            testID="bouton-partager"
          />
          <View style={styles.centre}>
            <Lien
              libelle={t.voir}
              onPress={() => router.replace({ pathname: '/tontine/[id]', params: { id: data.id } })}
            />
          </View>
        </>
      }
    >
      <View style={styles.centre}>
        <View style={styles.rond}>
          <CircleCheck size={tailles.icone * 2} color={couleurs.vert} strokeWidth={2} />
        </View>
      </View>
      <EnTete titre={t.titre} />
      <Texte variante="corpsGrand" couleur="texteSecondaire">
        {t.codeAide}
      </Texte>
      <View style={styles.code} accessible accessibilityLabel={data.code.split('').join(' ')}>
        <Texte variante="montantGeant" style={styles.chiffres} testID="code-invitation">
          {data.code}
        </Texte>
      </View>
      <View style={styles.recap}>
        <Texte variante="sousTitre">{data.nom}</Texte>
        {data.bien_prevu ? <Texte variante="corpsFort">{data.bien_prevu}</Texte> : null}
        <Texte>
          {t.recapMontant(formatMontant(data.montant), textes.frequences[data.frequence])}
        </Texte>
        <Texte>{t.recapMembres(data.nb_membres)}</Texte>
        <Texte>{t.recapDebut(formatDate(data.date_debut, { annee: true }))}</Texte>
      </View>
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
  code: {
    backgroundColor: couleurs.surface,
    borderRadius: rayons.carteGrande,
    paddingVertical: espacements.xl,
    alignItems: 'center',
  },
  chiffres: { letterSpacing: 8 },
  recap: { gap: espacements.s },
}));
