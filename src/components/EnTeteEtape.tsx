import { router } from 'expo-router';
import { View } from 'react-native';

import { textes } from '@/i18n';
import { espacements } from '@/theme';

import { BarreEtapes } from './BarreEtapes';
import { EnTete } from './EnTete';

type Props = { etape: number; titre: string };

/** En-tête du parcours de création : Retour + « Créer une tontine » + barre des 6 étapes. */
export function EnTeteEtape({ etape, titre }: Props) {
  return (
    <View style={{ gap: espacements.l }}>
      <BarreEtapes etape={etape} />
      <EnTete titre={titre} filAriane={textes.creation.filAriane} onRetour={() => router.back()} />
    </View>
  );
}
