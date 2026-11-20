import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Apercu = Database['public']['Functions']['apercu_tontine']['Returns'][number];

export async function chargerApercu(code: string): Promise<Apercu> {
  const { data, error } = await supabase.rpc('apercu_tontine', { p_code: code });
  if (error) throw error;
  if (!data?.[0]) throw new Error('code_inconnu');
  return data[0];
}
