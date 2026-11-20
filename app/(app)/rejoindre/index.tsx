import { Ecran, EnTete } from '@/components';
import { textes } from '@/i18n';
import { router } from 'expo-router';

/** Écran 12 — Rejoindre (complété à l'étape 4). */
export default function Rejoindre() {
  return (
    <Ecran>
      <EnTete titre={textes.accueil.rejoindreAvecCode} onRetour={() => router.back()} />
    </Ecran>
  );
}
