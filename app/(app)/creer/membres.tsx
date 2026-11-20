import { router } from 'expo-router';

import {
  BoutonPrincipal,
  ClavierNumerique,
  Ecran,
  EnTeteEtape,
  SaisieNombre,
  Texte,
} from '@/components';
import { MEMBRES_MAXIMUM, nbMembresValide } from '@/domain/validation';
import { textes } from '@/i18n';
import { useBrouillon } from '@/lib/brouillonCreation';
import { formatMontant } from '@/lib/format';

const t = textes.creation.membres;

/** Écran 09 — Créer · Membres (5/6) : 2 à 50, gérante comprise. */
export default function EtapeMembres() {
  const { brouillon, modifier } = useBrouillon();
  const n = brouillon.nbMembres;
  const valide = nbMembresValide(n);

  return (
    <Ecran
      pied={
        <>
          <BoutonPrincipal
            libelle={textes.commun.continuer}
            desactive={!valide}
            onPress={() => router.push('/creer/date')}
          />
          <ClavierNumerique
            onChiffre={(c) => {
              const suivant = Number(`${n || ''}${c}`);
              if (suivant <= MEMBRES_MAXIMUM) modifier({ nbMembres: suivant });
            }}
            onEffacer={() => modifier({ nbMembres: Math.floor(n / 10) })}
          />
        </>
      }
    >
      <EnTeteEtape etape={5} titre={t.titre} />
      <SaisieNombre valeur={String(n)} erreur={n > 0 && !valide} testID="saisie-membres" />
      <Texte couleur={n > 0 && !valide ? 'terracotta' : 'texteSecondaire'}>
        {n > 0 && !valide ? t.bornes : t.aide}
      </Texte>
      {valide ? (
        <Texte variante="corpsFort">
          {t.tours(n)} · {t.cagnotte(formatMontant(n * brouillon.montant))}
        </Texte>
      ) : null}
    </Ecran>
  );
}
