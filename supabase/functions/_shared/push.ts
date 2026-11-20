/**
 * Envoi des notifications push via le service Expo (https://exp.host/--/api/v2/push/send).
 * Chaque notification est d'abord écrite dans la table `notifications` (écran 22) ;
 * le push n'est qu'un complément : un échec n'empêche pas la notification in-app.
 */
import { rpc } from './api.ts';

const URL_EXPO = 'https://exp.host/--/api/v2/push/send';
const TAILLE_LOT = 100;

type ANotifier = { id: string; jeton: string | null; titre: string; corps: string; tontine_id: string | null };

export function estJetonExpo(jeton: string | null): jeton is string {
  return !!jeton && /^Expo(nent)?PushToken\[.+\]$/.test(jeton);
}

export async function envoyerPushEnAttente(): Promise<{ envoyees: number; sansJeton: number }> {
  const { data, error } = await rpc<ANotifier[]>('notifications_a_pousser', { p_limite: 500 });
  if (error || !data) throw new Error(error ?? 'lecture_impossible');

  const avecJeton = data.filter((n) => estJetonExpo(n.jeton));
  const sansJeton = data.filter((n) => !estJetonExpo(n.jeton));
  const traitees: string[] = sansJeton.map((n) => n.id);

  for (let i = 0; i < avecJeton.length; i += TAILLE_LOT) {
    const lot = avecJeton.slice(i, i + TAILLE_LOT);
    const r = await fetch(URL_EXPO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        lot.map((n) => ({
          to: n.jeton,
          title: n.titre,
          body: n.corps,
          sound: 'default',
          channelId: 'natt',
          data: { tontine_id: n.tontine_id, notification_id: n.id },
        })),
      ),
    });
    // On marque le lot comme traité même si Expo refuse : la notification reste visible dans l'app.
    if (!r.ok) console.error('Expo push', r.status, await r.text());
    traitees.push(...lot.map((n) => n.id));
  }

  if (traitees.length > 0) await rpc('marquer_pousses', { p_ids: traitees });
  return { envoyees: avecJeton.length, sansJeton: sansJeton.length };
}

/** Les fonctions planifiées n'acceptent que la clé service_role (appel par pg_cron). */
export function appelSysteme(req: Request): boolean {
  const cle = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return !!cle && req.headers.get('Authorization') === `Bearer ${cle}`;
}
