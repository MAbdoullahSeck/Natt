import { router } from 'expo-router';
import { Phone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import {
  BoutonPrincipal,
  CarteInfo,
  Ecran,
  EnTete,
  LigneInfo,
  Lien,
  PuceStatut,
  Texte,
} from '@/components';
import { type DonneesTontine, prenomDe } from '@/data/tontine';
import { statutAffiche } from '@/domain/statuts';
import { prochainPaiement, tourDuMembre, versCotisation } from '@/domain/tontine';
import { formatTelephoneComplet } from '@/domain/telephone';
import { textes } from '@/i18n';
import { formatDate, formatMoisAnnee, formatMontant } from '@/lib/format';
import { creerStyles, espacements, rayons } from '@/theme';

const t = textes.tontine.membre;

type Props = { donnees: DonneesTontine; complement?: ReactNode };

/** Écran 16 — Tontine · Membre. */
export function VueMembre({ donnees, complement }: Props) {
  const styles = useStyles();
  const { tontine, membres, tours, cotisations, monMembre } = donnees;
  const gerante = membres.find((m) => m.profil_id === tontine.gerante_id);
  const prochain = monMembre ? prochainPaiement(tours, cotisations, monMembre.id) : null;
  const monTour = monMembre ? tourDuMembre(tours, monMembre.id) : null;
  const statut = prochain
    ? statutAffiche(versCotisation(prochain.cotisation), prochain.tour.echeance)
    : null;
  const peutPayer = prochain && prochain.cotisation.statut === 'a_payer';

  return (
    <Ecran
      pied={
        peutPayer ? (
          <BoutonPrincipal
            libelle={t.payer}
            onPress={() =>
              router.push({
                pathname: '/tontine/[id]/payer',
                params: { id: tontine.id, cotisation: prochain.cotisation.id },
              })
            }
            testID="bouton-payer"
          />
        ) : null
      }
    >
      <EnTete titre={tontine.nom} onRetour={() => router.back()} />
      <View style={styles.carte}>
        <Texte variante="corpsFort" couleur="texteSecondaire">
          {t.prochainPaiement}
        </Texte>
        {prochain && statut ? (
          <>
            <Texte variante="montantGeant">{formatMontant(tontine.montant)}</Texte>
            <Texte variante="corpsFort">{t.avantLe(formatDate(prochain.tour.echeance))}</Texte>
            <PuceStatut statut={statut} />
          </>
        ) : (
          <Texte variante="corpsGrand">{t.rienAPayer}</Texte>
        )}
      </View>
      <View>
        {monTour ? (
          <LigneInfo libelle={t.tonTour} valeur={formatMoisAnnee(monTour.echeance)} />
        ) : null}
        {tontine.type === 'achat_groupe' && tontine.bien_prevu ? (
          <LigneInfo libelle={t.tonBien} valeur={tontine.bien_prevu} />
        ) : null}
        <LigneInfo libelle={t.gerante} valeur={prenomDe(membres, gerante?.id)} />
      </View>
      {gerante?.profil ? (
        <CarteInfo icone={Phone}>
          <Texte variante="corpsFort">{formatTelephoneComplet(gerante.profil.telephone)}</Texte>
        </CarteInfo>
      ) : null}
      <Lien
        libelle={textes.tours.titre}
        onPress={() => router.push({ pathname: '/tontine/[id]/tours', params: { id: tontine.id } })}
      />
      {complement}
    </Ecran>
  );
}

const useStyles = creerStyles((couleurs) => ({
  carte: {
    backgroundColor: couleurs.terracottaClair,
    borderRadius: rayons.carteGrande,
    padding: espacements.xl,
    gap: espacements.s,
  },
}));
