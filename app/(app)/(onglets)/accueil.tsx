import { Ecran, EnTete } from '@/components';
import { textes } from '@/i18n';

/** Écran 05 — Accueil (complété à l'étape 3). */
export default function Accueil() {
  return (
    <Ecran avecOnglets>
      <EnTete titre={textes.navigation.accueil} />
    </Ecran>
  );
}
