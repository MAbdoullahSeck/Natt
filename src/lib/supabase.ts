import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

/**
 * Client Supabase typé.
 * Variables EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY : fichier .env (voir .env.example),
 * projet natt-dev par défaut ; les tests e2e les remplacent par la stack locale.
 */
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseCle = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseCle) {
  throw new Error(
    'Configuration Supabase manquante : copie .env.example en .env (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY).',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseCle, {
  auth: {
    storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Rafraîchissement du jeton seulement quand l'app est au premier plan (recommandation Supabase).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (etat) => {
    if (etat === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
