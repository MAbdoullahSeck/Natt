import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

import {
  BoutonPrincipal,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  LigneTour,
  Texte,
} from '@/components';
import { prenomDe, useTontine } from '@/data/tontine';
import { useTirage } from '@/data/tours';
import { textes } from '@/i18n';
import { dateDuTour } from '@/lib/datesTour';
import { formatDate, formatHeure } from '@/lib/format';
import { partagerWhatsApp } from '@/lib/partage';
import { supabase } from '@/lib/supabase';

const t = textes.tours.resultat;

/** Écran 15c — Tirage au sort · Résultat. */
export default function ResultatTirage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tontine = useTontine(id);
  const tirage = useTirage(id);
  const client = useQueryClient();

  // Compte la personne dans « vu par N membres ».
  useEffect(() => {
    supabase.rpc('marquer_tirage_vu', { p_tontine_id: id }).then(() => {
      client.invalidateQueries({ queryKey: ['tirage', id] });
    });
  }, [id, client]);

  if (tontine.isLoading || tirage.isLoading) return <Chargement />;
  if (tontine.error || !tontine.data || !tirage.data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={tontine.error ?? tirage.error} onReessayer={tontine.refetch} />
      </Ecran>
    );

  const { tours, membres, tontine: tt } = tontine.data;
  const { evenement, vues } = tirage.data;
  // Ordre tel qu'il a été tiré (les échanges faits ensuite ne le modifient pas).
  const ordreTire = ((evenement.donnees as { ordre?: string[] } | null)?.ordre ?? []).map(
    (membreId, i) => ({ membreId, numero: i + 1, echeance: tours[i]?.echeance ?? '' }),
  );
  const lignes = ordreTire
    .map((x) =>
      t.ligne(x.numero, prenomDe(membres, x.membreId), dateDuTour(x.echeance, tt.frequence)),
    )
    .join('\n');

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.envoyer}
          icone={Send}
          onPress={() => partagerWhatsApp(t.message(tt.nom, lignes))}
        />
      }
    >
      <EnTete titre={t.titre} filAriane={tt.nom} onRetour={() => router.back()} />
      <Texte variante="corpsFort">
        {t.quand(
          formatDate(evenement.created_at, { annee: true }),
          formatHeure(evenement.created_at),
        )}
      </Texte>
      <Texte couleur="texteSecondaire">{t.vuPar(vues)}</Texte>
      <View>
        {ordreTire.map((x) => (
          <LigneTour
            key={x.membreId}
            numero={x.numero}
            prenom={prenomDe(membres, x.membreId)}
            periode={dateDuTour(x.echeance, tt.frequence)}
          />
        ))}
      </View>
    </Ecran>
  );
}
