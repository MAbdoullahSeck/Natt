import { Ecran, EnTete } from '@/components';
import { textes } from '@/i18n';
import { router } from 'expo-router';

/** Écrans 20 / 21 — Abonnement (complété à l'étape 10). */
export default function Abonnement() {
  return (
    <Ecran>
      <EnTete titre={textes.erreurs.codes.limite_atteinte} onRetour={() => router.back()} />
    </Ecran>
  );
}
