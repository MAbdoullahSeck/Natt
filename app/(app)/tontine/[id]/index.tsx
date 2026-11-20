import { Ecran, EnTete } from '@/components';
import { textes } from '@/i18n';
import { router } from 'expo-router';

/** Écrans 13 / 16 — vue de la tontine (complétée à l'étape 5). */
export default function VueTontine() {
  return (
    <Ecran>
      <EnTete titre={textes.accueil.titre} onRetour={() => router.back()} />
    </Ecran>
  );
}
