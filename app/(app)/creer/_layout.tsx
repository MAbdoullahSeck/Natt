import { Stack } from 'expo-router';

import { BrouillonProvider } from '@/lib/brouillonCreation';
import { useCouleurs } from '@/theme';

export default function LayoutCreation() {
  const couleurs = useCouleurs();
  return (
    <BrouillonProvider>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}
      />
    </BrouillonProvider>
  );
}
