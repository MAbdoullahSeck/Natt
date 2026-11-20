import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

import { ecouterOuvertureNotifications, enregistrerPush } from '@/lib/notificationsPush';
import { useSession } from '@/lib/session';
import { couleurs } from '@/theme';

/** Espace connecté : session et profil obligatoires. */
export default function LayoutApp() {
  const { session, profil } = useSession();
  const profilId = profil?.id;

  useEffect(() => {
    if (!profilId) return;
    enregistrerPush(profilId).catch(() => undefined);
    return ecouterOuvertureNotifications();
  }, [profilId]);

  if (!session) return <Redirect href="/telephone" />;
  if (!profil) return <Redirect href="/prenom" />;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}
    />
  );
}
