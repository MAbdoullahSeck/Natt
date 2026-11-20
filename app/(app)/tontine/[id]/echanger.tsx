import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftRight, User } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BoutonPrincipal,
  Chargement,
  Ecran,
  EnTete,
  EtatErreur,
  OptionSelection,
  Texte,
} from '@/components';
import { prenomDe, useTontine } from '@/data/tontine';
import { useEchangerTours } from '@/data/tours';
import { partenairesPossibles } from '@/domain/tours';
import { textes } from '@/i18n';
import { dateDuTour } from '@/lib/datesTour';
import { messageErreur } from '@/lib/erreurs';
import { couleurs, espacements, rayons } from '@/theme';

const t = textes.tours.echanger;

/** Écran 15b — Tours · Échanger (tours non versés uniquement). */
export default function Echanger() {
  const { id, membre } = useLocalSearchParams<{ id: string; membre: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const echanger = useEchangerTours(id);
  const [choix, setChoix] = useState<string | null>(null);

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );

  const { tours, membres, tontine } = data;
  const tourA = tours.find((x) => x.beneficiaire_membre_id === membre);
  const partenaires = partenairesPossibles(tours, membre);

  return (
    <Ecran
      pied={
        <BoutonPrincipal
          libelle={t.bouton}
          icone={ArrowLeftRight}
          desactive={!choix || echanger.isPending}
          onPress={() =>
            choix && echanger.mutate({ a: membre, b: choix }, { onSuccess: () => router.back() })
          }
          testID="bouton-echanger"
        />
      }
    >
      <EnTete titre={t.titre} filAriane={tontine.nom} onRetour={() => router.back()} />
      {tourA ? (
        <View style={styles.carte}>
          <Texte couleur="texteSecondaire">{t.aDeplacer}</Texte>
          <Texte variante="sousTitre">
            {t.ligne(
              tourA.numero,
              prenomDe(membres, membre),
              dateDuTour(tourA.echeance, tontine.frequence),
            )}
          </Texte>
        </View>
      ) : null}
      <Texte variante="corpsFort">{t.avecQui}</Texte>
      {partenaires.length === 0 ? <Texte>{t.aucun}</Texte> : null}
      {partenaires.map((p) => {
        const tour = tours.find((x) => x.beneficiaire_membre_id === p)!;
        return (
          <OptionSelection
            key={p}
            icone={User}
            titre={prenomDe(membres, p)}
            sousTitre={textes.tours.echanger.ligne(
              tour.numero,
              prenomDe(membres, p),
              dateDuTour(tour.echeance, tontine.frequence),
            )}
            selectionne={choix === p}
            onPress={() => setChoix(p)}
          />
        );
      })}
      {echanger.error ? <Texte couleur="terracotta">{messageErreur(echanger.error)}</Texte> : null}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.terracottaClair,
    borderRadius: rayons.carte,
    padding: espacements.l,
    gap: espacements.xs,
  },
});
