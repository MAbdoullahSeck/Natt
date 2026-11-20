import { router, useLocalSearchParams } from 'expo-router';
import { Shuffle } from 'lucide-react-native';
import { View } from 'react-native';

import {
  BoutonPrincipal,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  LigneTour,
  Lien,
  Texte,
} from '@/components';
import { prenomDe, useTontine } from '@/data/tontine';
import { useLancerTirage, useTirage } from '@/data/tours';
import { tiragePossible } from '@/domain/tours';
import { textes } from '@/i18n';
import { dateDuTour } from '@/lib/datesTour';
import { messageErreur } from '@/lib/erreurs';

const t = textes.tours;

/** Écran 15 — Ordre des tours ; tirage au sort ; appui long → échange (gérante). */
export default function OrdreDesTours() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const tirage = useTirage(id);
  const lancer = useLancerTirage(id);

  if (isLoading || tirage.isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  const { tontine, tours, membres, estGerante } = data;
  const dejaFait = !!tirage.data;
  const possible = tiragePossible(tours, membres.length, tontine.nb_membres, dejaFait);

  return (
    <Ecran
      pied={
        estGerante && possible ? (
          <BoutonPrincipal
            libelle={lancer.isPending ? t.tirageEnCours : t.tirage}
            icone={Shuffle}
            desactive={lancer.isPending}
            onPress={() =>
              lancer.mutate(undefined, {
                onSuccess: () => router.push({ pathname: '/tontine/[id]/tirage', params: { id } }),
              })
            }
            testID="bouton-tirage"
          />
        ) : null
      }
    >
      <EnTete titre={t.titre} filAriane={tontine.nom} onRetour={() => router.back()} />
      {estGerante ? <Texte couleur="texteSecondaire">{t.aideEchange}</Texte> : null}
      <View>
        {tours.map((tour) => (
          <LigneTour
            key={tour.id}
            numero={tour.numero}
            prenom={
              tour.beneficiaire_membre_id
                ? prenomDe(membres, tour.beneficiaire_membre_id)
                : t.personne
            }
            periode={dateDuTour(tour.echeance, tontine.frequence)}
            mention={tour.verse_at ? t.verse : undefined}
            onLongPress={
              estGerante && !tour.verse_at && tour.beneficiaire_membre_id
                ? () =>
                    router.push({
                      pathname: '/tontine/[id]/echanger',
                      params: { id, membre: tour.beneficiaire_membre_id! },
                    })
                : undefined
            }
          />
        ))}
      </View>
      {dejaFait ? (
        <Lien
          libelle={t.voirTirage}
          onPress={() => router.push({ pathname: '/tontine/[id]/tirage', params: { id } })}
        />
      ) : null}
      {estGerante && !dejaFait && !possible && membres.length < tontine.nb_membres ? (
        <Texte couleur="texteSecondaire">{t.tirageImpossible}</Texte>
      ) : null}
      {lancer.error ? <Texte couleur="terracotta">{messageErreur(lancer.error)}</Texte> : null}
    </Ecran>
  );
}
