import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { CalendarHeart } from 'lucide-react-native';
import { useState } from 'react';

import {
  BoutonPrincipal,
  CarteInfo,
  ChoixDate,
  Ecran,
  EnTeteEtape,
  Lien,
  Texte,
} from '@/components';
import { usePalierActif } from '@/data/abonnement';
import { cles } from '@/data/cles';
import { palierSuperieur } from '@/domain/abonnement';
import { suggererAjustement } from '@/domain/calendrier';
import { echeanceTour, jour, versISO } from '@/domain/dates';
import { textes } from '@/i18n';
import { useBrouillon } from '@/lib/brouillonCreation';
import { codeErreur, messageErreur } from '@/lib/erreurs';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const t = textes.creation.date;

/** Écran 10 — Créer · Date (6/6), suggestion de calendrier, création. */
export default function EtapeDate() {
  const { brouillon, modifier } = useBrouillon();
  const { palier } = usePalierActif();
  const client = useQueryClient();
  const [ajusteDepuis, setAjusteDepuis] = useState<Date | null>(null);
  const aujourdhui = jour(new Date());
  const debut = brouillon.dateDebut < aujourdhui ? aujourdhui : jour(brouillon.dateDebut);
  const fin = echeanceTour(debut, brouillon.frequence, brouillon.nbMembres);

  const evenements = useQuery({
    queryKey: ['calendrier', versISO(debut), brouillon.frequence, brouillon.nbMembres],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('suggestions_calendrier', {
        p_date_debut: versISO(debut),
        p_frequence: brouillon.frequence,
        p_nb_membres: brouillon.nbMembres,
      });
      if (error) throw error;
      return data;
    },
  });
  const suggestion = suggererAjustement(
    debut,
    brouillon.frequence,
    brouillon.nbMembres,
    evenements.data ?? [],
  );

  const creation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('creer_tontine', {
        p_nom: brouillon.nom.trim(),
        p_type: brouillon.type,
        p_bien_prevu: brouillon.type === 'achat_groupe' ? brouillon.bienPrevu.trim() : '',
        p_montant: brouillon.montant,
        p_frequence: brouillon.frequence,
        p_nb_membres: brouillon.nbMembres,
        p_date_debut: versISO(debut),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (tontine) => {
      client.invalidateQueries({ queryKey: cles.mesTontines });
      router.dismissAll();
      router.replace({ pathname: '/creer/cree', params: { id: tontine.id } });
    },
    onError: (erreur) => {
      // B3 : limite du palier atteinte → écran abonnement, palier supérieur présélectionné.
      if (codeErreur(erreur) === 'limite_atteinte') {
        router.push({ pathname: '/abonnement', params: { palier: palierSuperieur(palier) } });
      }
    },
  });

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.bouton}
          desactive={creation.isPending}
          onPress={() => creation.mutate()}
          testID="bouton-creer-tontine"
        />
      }
    >
      <EnTeteEtape etape={6} titre={t.titre} />
      <ChoixDate
        valeur={debut}
        minimum={aujourdhui}
        onChange={(d) => {
          setAjusteDepuis(null);
          modifier({ dateDebut: d });
        }}
      />
      <Texte couleur="texteSecondaire">{t.dernierTour(formatDate(fin, { annee: true }))}</Texte>
      {suggestion ? (
        <CarteInfo icone={CalendarHeart}>
          <Texte>
            {t.suggestion(suggestion.evenement.nom, formatDate(suggestion.evenement.date_debut))}
          </Texte>
          <Lien
            libelle={t.ajuster}
            onPress={() => {
              setAjusteDepuis(debut);
              modifier({ dateDebut: suggestion.nouvelleDate });
            }}
          />
        </CarteInfo>
      ) : null}
      {ajusteDepuis && !suggestion ? (
        <Texte couleur="vert">{t.ajuste(formatDate(debut))}</Texte>
      ) : null}
      {creation.error && codeErreur(creation.error) !== 'limite_atteinte' ? (
        <Texte couleur="terracotta">{messageErreur(creation.error)}</Texte>
      ) : null}
    </Ecran>
  );
}
