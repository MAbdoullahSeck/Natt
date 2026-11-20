import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

const BUCKET = 'captures';

/** Choisit une image dans la galerie et l'envoie dans le bucket privé « captures ». */
export async function choisirEtEnvoyerCapture(
  tontineId: string,
  cotisationId: string,
): Promise<string | null> {
  const choix = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.6,
  });
  if (choix.canceled || !choix.assets[0]) return null;
  const image = choix.assets[0];
  const extension = image.mimeType === 'image/png' ? 'png' : 'jpg';
  const chemin = `${tontineId}/${cotisationId}/${Date.now()}.${extension}`;
  const contenu = await (await fetch(image.uri)).arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(chemin, contenu, {
    contentType: image.mimeType ?? 'image/jpeg',
  });
  if (error) throw error;
  const rpc = await supabase.rpc('joindre_capture', {
    p_cotisation_id: cotisationId,
    p_capture_path: chemin,
  });
  if (rpc.error) throw rpc.error;
  return chemin;
}

/** Lien temporaire (10 minutes) pour afficher une capture. */
export async function urlCapture(chemin: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(chemin, 600);
  return data?.signedUrl ?? null;
}
