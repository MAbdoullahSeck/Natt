// Edge Function « relances » (A1–A3, P5) : chaque jour à 9 h (Dakar) via pg_cron.
// Prépare les relances J-3 / J / J+1, le récapitulatif des retards et les pénalités, puis envoie les push.
import { reponse, rpc } from '../_shared/api.ts';
import { appelSysteme, envoyerPushEnAttente } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (!(await appelSysteme(req))) return reponse({ error: 'non_autorise' }, 401);
  const { data, error } = await rpc<Record<string, unknown>>('preparer_relances', {});
  if (error) return reponse({ error }, 500);
  const push = await envoyerPushEnAttente().catch((e) => ({ error: String(e) }));
  return reponse({ relances: data, push });
});
