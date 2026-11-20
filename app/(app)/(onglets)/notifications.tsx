import { Ecran, EnTete } from '@/components';
import { textes } from '@/i18n';

/** Écran 22 — Notifications (complété à l'étape 8). */
export default function Notifications() {
  return (
    <Ecran avecOnglets>
      <EnTete titre={textes.navigation.notifications} />
    </Ecran>
  );
}
