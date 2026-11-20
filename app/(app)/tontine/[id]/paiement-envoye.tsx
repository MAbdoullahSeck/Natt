import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { BoutonPrincipal, BoutonSecondaire, Ecran, EnTete, Texte } from '@/components';
import { prenomDe, useTontine } from '@/data/tontine';
import { textes } from '@/i18n';
import { choisirEtEnvoyerCapture } from '@/lib/captures';
import { messageErreur } from '@/lib/erreurs';
import { creerStyles, tailles, useCouleurs } from '@/theme';

const t = textes.paiement.envoye;

/** Écran 18 — Paiement envoyé (capture facultative). */
export default function PaiementEnvoye() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id, cotisation } = useLocalSearchParams<{ id: string; cotisation: string }>();
  const { data } = useTontine(id);
  const gerante = data
    ? prenomDe(data.membres, data.membres.find((m) => m.profil_id === data.tontine.gerante_id)?.id)
    : '';
  const capture = useMutation({ mutationFn: () => choisirEtEnvoyerCapture(id, cotisation) });

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.terminer}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace({ pathname: '/tontine/[id]', params: { id } })
          }
          testID="bouton-terminer"
        />
      }
    >
      <View style={styles.centre}>
        <View style={styles.rond}>
          <CircleCheck size={tailles.icone * 2} color={couleurs.vert} strokeWidth={2} />
        </View>
      </View>
      <EnTete titre={t.titre} />
      <Texte variante="corpsGrand">{t.texte(gerante)}</Texte>
      {capture.data ? (
        <Texte variante="corpsFort" couleur="vert">
          {t.captureAjoutee}
        </Texte>
      ) : (
        <BoutonSecondaire
          libelle={capture.isPending ? t.captureEnCours : t.capture}
          icone={Camera}
          desactive={capture.isPending}
          onPress={() => capture.mutate()}
        />
      )}
      {capture.error ? <Texte couleur="terracotta">{messageErreur(capture.error)}</Texte> : null}
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
