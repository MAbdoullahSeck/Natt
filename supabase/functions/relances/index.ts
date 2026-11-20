// Edge Function « relances » (A1–A3, P5) : chaque jour à 9 h (Dakar) via pg_cron.
// Prépare les relances J-3 / J / J+1, le récapitulatif des retards, les pénalités et les liens de paiement
// des abonnements qui expirent dans 5 jours, puis envoie les push.
// Corps facultatif { "jour": "AAAA-MM-JJ" } : date simulée, pour les tests de bout en bout (appel système seulement).
import { reponse, rpc } from '../_shared/api.ts';
import { appelSysteme, envoyerPushEnAttente } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (!(await appelSysteme(req))) return reponse({ error: 'non_autorise' }, 401);
  const corps = await req.json().catch(() => ({}));
  const jour = typeof corps?.jour === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(corps.jour) ? corps.jour : null;
  const { data, error } = await rpc<Record<string, unknown>>('preparer_relances_et_abonnements', jour ? { p_jour: jour } : {});
  if (error) return reponse({ error }, 500);
  const push = await envoyerPushEnAttente().catch((e) => ({ error: String(e) }));
  return reponse({ relances: data, push });
});
