import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/session';
import { couleurs } from '@/theme';

/** Espace connecté : session et profil obligatoires. */
export default function LayoutApp() {
  const { session, profil } = useSession();
  if (!session) return <Redirect href="/telephone" />;
  if (!profil) return <Redirect href="/prenom" />;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}
    />
  );
}
