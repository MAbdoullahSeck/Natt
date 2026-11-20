// Edge Function « push » : envoie les notifications en attente (appelée chaque minute par pg_cron).
import { reponse } from '../_shared/api.ts';
import { appelSysteme, envoyerPushEnAttente } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (!(await appelSysteme(req))) return reponse({ error: 'non_autorise' }, 401);
  try {
    return reponse(await envoyerPushEnAttente());
  } catch (e) {
    return reponse({ error: String(e) }, 500);
  }
});
