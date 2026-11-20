import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabaseUrl } from './supabase';

const CLE = 'natt.invitation-en-attente';

/** Lien https partagé sur WhatsApp (Edge Function « invitation »). */
export function lienInvitation(code: string): string {
  return `${supabaseUrl}/functions/v1/invitation?code=${code}`;
}

/** Extrait un code d'invitation valide (6 chiffres) d'un paramètre ou d'un lien. */
export function codeInvitation(valeur: string | string[] | null | undefined): string | null {
  const texte = Array.isArray(valeur) ? valeur[0] : valeur;
  if (!texte) return null;
  const parametre = /[?&]code=(\d{6})(?:\D|$)/.exec(texte)?.[1];
  const code = parametre ?? texte.replace(/\D/g, '');
  return /^\d{6}$/.test(code) ? code : null;
}

/** Garde le code d'un lien ouvert avant la connexion, pour l'utiliser juste après. */
export async function memoriserInvitation(code: string): Promise<void> {
  await AsyncStorage.setItem(CLE, code).catch(() => undefined);
}

export async function reprendreInvitation(): Promise<string | null> {
  const code = await AsyncStorage.getItem(CLE).catch(() => null);
  if (code) await AsyncStorage.removeItem(CLE).catch(() => undefined);
  return codeInvitation(code);
}
