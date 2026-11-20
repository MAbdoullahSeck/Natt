import { router } from 'expo-router';

import {
  BoutonPrincipal,
  ClavierNumerique,
  Ecran,
  EnTeteEtape,
  SaisieNombre,
  Texte,
} from '@/components';
import { MONTANT_MAXIMUM, MONTANT_MINIMUM, montantValide } from '@/domain/validation';
import { textes } from '@/i18n';
import { useBrouillon } from '@/lib/brouillonCreation';
import { formatMontant } from '@/lib/format';

const t = textes.creation.montant;

/** Écran 07 — Créer · Montant (3/6), pavé numérique, minimum 500 F. */
export default function EtapeMontant() {
  const { brouillon, modifier } = useBrouillon();
  const montant = brouillon.montant;
  const tropPetit = montant > 0 && montant < MONTANT_MINIMUM;

  return (
    <Ecran
      pied={
        <>
          <BoutonPrincipal
            libelle={textes.commun.continuer}
            desactive={!montantValide(montant)}
            onPress={() => router.push('/creer/frequence')}
          />
          <ClavierNumerique
            onChiffre={(c) => {
              const suivant = Number(`${montant || ''}${c}`);
              if (suivant <= MONTANT_MAXIMUM) modifier({ montant: suivant });
            }}
            onEffacer={() => modifier({ montant: Math.floor(montant / 10) })}
          />
        </>
      }
    >
      <EnTeteEtape etape={3} titre={t.titre} />
      <SaisieNombre valeur={formatMontant(montant)} erreur={tropPetit} testID="saisie-montant" />
      <Texte couleur={tropPetit ? 'terracotta' : 'texteSecondaire'}>
        {tropPetit ? t.minimum(formatMontant(MONTANT_MINIMUM)) : t.aide}
      </Texte>
    </Ecran>
  );
}
