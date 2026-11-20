import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

/**
 * Client Supabase typé.
 * Variables : EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY (voir .env.example).
 * Sans variables, on vise la stack locale (`npm run db:start`) — clé publique de démonstration.
 */
const URL_LOCALE = 'http://127.0.0.1:54321';
const CLE_LOCALE = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? URL_LOCALE;
const supabaseCle = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? CLE_LOCALE;

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
