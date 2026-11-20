import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { reprendreInvitation } from '@/lib/invitation';
import { useSession } from '@/lib/session';

/** Aiguillage : inscription, prénom manquant, invitation en attente, ou accueil. */
export default function Index() {
  const { session, profil } = useSession();
  const [invitation, setInvitation] = useState<string | null | undefined>(undefined);
  const pret = !!session && !!profil;

  useEffect(() => {
    if (pret) reprendreInvitation().then(setInvitation);
  }, [pret]);

  if (!session) return <Redirect href="/telephone" />;
  if (!profil) return <Redirect href="/prenom" />;
  if (invitation === undefined) return null;
  if (invitation)
    return <Redirect href={{ pathname: '/rejoindre/reglement', params: { code: invitation } }} />;
  return <Redirect href="/accueil" />;
}
