import { Redirect, Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { codeInvitation, memoriserInvitation } from '@/lib/invitation';
import { ecouterOuvertureNotifications, enregistrerPush } from '@/lib/notificationsPush';
import { useSession } from '@/lib/session';
import { useCouleurs } from '@/theme';

/** Espace connecté : session et profil obligatoires. */
export default function LayoutApp() {
  const couleurs = useCouleurs();
  const { session, profil } = useSession();
  const profilId = profil?.id;
  const chemin = usePathname();
  const { code } = useGlobalSearchParams<{ code?: string }>();
  const invitation = chemin.startsWith('/rejoindre') ? codeInvitation(code) : null;

  // Lien d'invitation ouvert avant la connexion : le code est repris après l'inscription.
  useEffect(() => {
    if (invitation && (!session || !profil)) memoriserInvitation(invitation);
  }, [invitation, session, profil]);

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
