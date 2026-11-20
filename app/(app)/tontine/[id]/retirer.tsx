import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { UserMinus, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';

import {
  BoutonPrincipal,
  CarteInfo,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  OptionSelection,
  Texte,
} from '@/components';
import { cles } from '@/data/cles';
import { prenomDe, useTontine } from '@/data/tontine';
import { cagnotteApresSuppression, possibiliteRetrait } from '@/domain/retrait';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatMontant } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const t = textes.retrait;

/** Point 6 — « Retirer Moussa ? » : confirmation obligatoire, logique côté serveur (retirer_membre). */
export default function RetirerMembre() {
  const { id, membre } = useLocalSearchParams<{ id: string; membre: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const client = useQueryClient();
  const [mode, setMode] = useState<'remplacer' | 'supprimer' | null>(null);

  const retirer = useMutation({
    mutationFn: async (m: 'remplacer' | 'supprimer') => {
      const { error: e } = await supabase.rpc('retirer_membre', { p_membre_id: membre, p_mode: m });
      if (e) throw e;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: cles.tontine(id) });
      client.invalidateQueries({ queryKey: cles.mesTontines });
      router.dismissTo({ pathname: '/tontine/[id]', params: { id } });
    },
  });

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={textes.tontine.membres} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  const prenom = prenomDe(data.tousMembres, membre);
  const m = data.membres.find((x) => x.id === membre);
  const possibilite = possibiliteRetrait({
    statutTontine: data.tontine.statut,
    estLaGerante: m?.profil_id === data.tontine.gerante_id,
    membreId: membre,
    tours: data.tours,
  });
  const modeChoisi = possibilite.possible && !possibilite.choixDuMode ? 'remplacer' : mode;

  return (
    <Ecran
      pied={
        possibilite.possible ? (
          <BoutonPrincipal
            libelle={t.bouton(prenom)}
            icone={UserMinus}
            desactive={!modeChoisi || retirer.isPending}
            onPress={() => modeChoisi && retirer.mutate(modeChoisi)}
            testID="bouton-retirer-membre"
          />
        ) : null
      }
    >
      <EnTete titre={t.titre(prenom)} filAriane={data.tontine.nom} onRetour={() => router.back()} />
      {!possibilite.possible ? (
        <CarteInfo>{t.impossible[possibilite.raison](prenom)}</CarteInfo>
      ) : possibilite.choixDuMode ? (
        <>
          <Texte variante="corpsGrand">{t.cycle(prenom)}</Texte>
          <OptionSelection
            icone={UserPlus}
            titre={t.remplacer}
            sousTitre={t.remplacerDetail}
            selectionne={mode === 'remplacer'}
            onPress={() => setMode('remplacer')}
            testID="mode-remplacer"
          />
          <OptionSelection
            icone={Users}
            titre={t.supprimer}
            sousTitre={t.supprimerDetail(
              data.tontine.nb_membres - 1,
              formatMontant(
                cagnotteApresSuppression(data.tontine.montant, data.tontine.nb_membres),
              ),
            )}
            selectionne={mode === 'supprimer'}
            onPress={() => setMode('supprimer')}
            testID="mode-supprimer"
          />
          <Texte couleur="texteSecondaire">{t.remboursement}</Texte>
        </>
      ) : (
        <Texte variante="corpsGrand">{t.preparation(prenom)}</Texte>
      )}
      {retirer.error ? <Texte couleur="terracotta">{messageErreur(retirer.error)}</Texte> : null}
    </Ecran>
  );
}
