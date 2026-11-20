import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import type { Tables } from './database.types';
import { supabase } from './supabase';

export type Profil = Tables<'profils'>;

type EtatSession = {
  /** Vrai tant que la session et le profil ne sont pas connus. */
  chargement: boolean;
  session: Session | null;
  profil: Profil | null;
  rafraichirProfil: () => Promise<Profil | null>;
  deconnecter: () => Promise<void>;
};

const ContexteSession = createContext<EtatSession | null>(null);

async function lireProfil(id: string): Promise<Profil | null> {
  const { data, error } = await supabase.from('profils').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Session persistante (AsyncStorage) + profil de l'utilisatrice connectée. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfil(null);
      return null;
    }
    try {
      const p = await lireProfil(s.user.id);
      setProfil(p);
      return p;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let actif = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!actif) return;
      setSession(data.session);
      await chargerProfil(data.session);
      if (actif) setChargement(false);
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, nouvelle) => {
      setSession(nouvelle);
      // Pas d'appel Supabase directement dans le rappel (recommandation supabase-js).
      setTimeout(() => {
        chargerProfil(nouvelle);
      }, 0);
    });
    return () => {
      actif = false;
      abonnement.subscription.unsubscribe();
    };
  }, [chargerProfil]);

  const rafraichirProfil = useCallback(() => chargerProfil(session), [chargerProfil, session]);

  const deconnecter = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfil(null);
  }, []);

  return (
    <ContexteSession.Provider
      value={{ chargement, session, profil, rafraichirProfil, deconnecter }}
    >
      {children}
    </ContexteSession.Provider>
  );
}

export function useSession(): EtatSession {
  const valeur = useContext(ContexteSession);
  if (!valeur) throw new Error('useSession doit être utilisé dans SessionProvider');
  return valeur;
}

/** Profil connecté (à utiliser dans le groupe (app), où il est garanti). */
export function useProfil(): Profil {
  const { profil } = useSession();
  if (!profil) throw new Error('Aucun profil connecté');
  return profil;
}
