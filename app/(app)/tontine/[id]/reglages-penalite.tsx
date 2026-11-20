import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  BoutonPrincipal,
  Chargement,
  ClavierNumerique,
  Ecran,
  EnTete,
  EtatErreur,
  SaisieNombre,
  Texte,
} from '@/components';
import { useModifierReglages } from '@/data/reglages';
import { useTontine } from '@/data/tontine';
import { textes } from '@/i18n';
import { messageErreur } from '@/lib/erreurs';
import { formatMontant } from '@/lib/format';

const t = textes.reglages.penaliteEcran;
const MAXIMUM = 1_000_000;

/** Montant de la pénalité de retard (0 = aucune), au pavé numérique. */
export default function ReglagePenalite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useTontine(id);
  const modifier = useModifierReglages(id);
  const [montant, setMontant] = useState<number | null>(null);

  if (isLoading) return <Chargement />;
  if (error || !data)
    return (
      <Ecran>
        <EnTete titre={t.titre} onRetour={() => router.back()} />
        <EtatErreur erreur={error} onReessayer={refetch} />
      </Ecran>
    );
  const tt = data.tontine;
  const valeur = montant ?? tt.penalite_retard;

  return (
    <Ecran
      pied={
        <>
          <BoutonPrincipal
            libelle={t.bouton}
            desactive={modifier.isPending}
            onPress={() =>
              modifier.mutate(
                {
                  jMoins3: tt.relance_j_moins_3,
                  jourJ: tt.relance_jour_j,
                  jPlus1: tt.relance_j_plus_1,
                  penalite: valeur,
                },
                { onSuccess: () => router.back() },
              )
            }
          />
          <ClavierNumerique
            onChiffre={(c) => {
              const suivant = Number(`${valeur || ''}${c}`);
              if (suivant <= MAXIMUM) setMontant(suivant);
            }}
            onEffacer={() => setMontant(Math.floor(valeur / 10))}
          />
        </>
      }
    >
      <EnTete titre={t.titre} filAriane={tt.nom} onRetour={() => router.back()} />
      <SaisieNombre valeur={formatMontant(valeur)} />
      <Texte couleur="texteSecondaire">{t.aide}</Texte>
      {modifier.error ? <Texte couleur="terracotta">{messageErreur(modifier.error)}</Texte> : null}
    </Ecran>
  );
}
