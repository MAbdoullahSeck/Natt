import { router } from 'expo-router';

import { Ecran, EnTete } from '@/components';
import { textes } from '@/i18n';

/** Écran complété dans une étape suivante. */
export default function Ecran_tours() {
  return (
    <Ecran>
      <EnTete titre={textes.tontine.tours} onRetour={() => router.back()} />
    </Ecran>
  );
}
