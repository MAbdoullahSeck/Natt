import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/session';
import { useCouleurs } from '@/theme';

export default function LayoutInscription() {
  const couleurs = useCouleurs();
  const { session, profil } = useSession();
  if (session && profil) return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}
    />
  );
}
