import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

/** Aiguillage : inscription, prénom manquant, ou accueil. */
export default function Index() {
  const { session, profil } = useSession();
  if (!session) return <Redirect href="/telephone" />;
  if (!profil) return <Redirect href="/prenom" />;
  return <Redirect href="/accueil" />;
}
