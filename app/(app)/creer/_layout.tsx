import { Stack } from 'expo-router';

import { BrouillonProvider } from '@/lib/brouillonCreation';
import { couleurs } from '@/theme';

export default function LayoutCreation() {
  return (
    <BrouillonProvider>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}
      />
    </BrouillonProvider>
  );
}
