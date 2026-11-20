// Edge Function « tirage-au-sort » (O2) : mélange côté serveur, une seule fois par cycle.
// Appel depuis l'app : supabase.functions.invoke('tirage-au-sort', { body: { tontine_id } }).
import { CORS, lire, reponse, rpc, utilisatrice } from '../_shared/api.ts';
import { ALGORITHME, melanger, nouvelleGraine, versHex } from '../_shared/melange.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const moi = await utilisatrice(req);
  if (!moi) return reponse({ error: 'non_connecte' }, 401);

  const tontineId = await req
    .json()
    .then((c) => c?.tontine_id as string | undefined)
    .catch(() => undefined);
  if (!tontineId || !/^[0-9a-f-]{36}$/.test(tontineId)) return reponse({ error: 'introuvable' }, 400);

  const membres = await lire<{ id: string }[]>(
    `membres?select=id&tontine_id=eq.${tontineId}&order=rang`,
  );
  const graine = nouvelleGraine();
  const ordre = await melanger(
    membres.map((m) => m.id),
    graine,
  );

  // Les vérifications métier (gérante, une fois par cycle, tontine complète…) sont faites en SQL.
  const { data, error } = await rpc<string>('appliquer_tirage', {
    p_tontine_id: tontineId,
    p_auteur_id: moi.id,
    p_ordre: ordre,
    p_graine: versHex(graine),
    p_algorithme: ALGORITHME,
  });
  if (error) return reponse({ error }, 400);
  return reponse({ evenement_id: data, ordre });
});
