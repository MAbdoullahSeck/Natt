// Edge Function « paytech-ipn » : notification de paiement instantanée envoyée par PayTech.
// 1. Authenticité : SHA-256 des clés API et secrète comparés à api_key_sha256 / api_secret_sha256 ; sinon 401.
// 2. traiter_ipn_paytech (SQL) : doublons ignorés, paiement marqué réussi, abonnement activé ou prolongé,
//    événement dans le journal, notification à la gérante.
import { reponse, rpc } from '../_shared/api.ts';
import { ipnAuthentique, lireChampsIpn } from '../_shared/paytech.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reponse({ error: 'methode' }, 405);
  const champs = await lireChampsIpn(req).catch(() => ({}) as Record<string, string>);

  const authentique = await ipnAuthentique(
    champs,
    Deno.env.get('PAYTECH_API_KEY') ?? '',
    Deno.env.get('PAYTECH_API_SECRET') ?? '',
  );
  if (!authentique) return reponse({ error: 'ipn_non_authentique' }, 401);

  // On ne garde pas les empreintes des clés dans la base.
  const { api_key_sha256: _a, api_secret_sha256: _b, ...donnees } = champs;
  const { data, error } = await rpc<string>('traiter_ipn_paytech', {
    p_ref_command: champs.ref_command ?? '',
    p_evenement: champs.type_event ?? '',
    p_moyen: champs.payment_method ?? null,
    p_donnees: donnees,
  });
  if (error) {
    console.error('IPN PayTech', error, champs.ref_command);
    return reponse({ error }, error === 'commande_inconnue' ? 404 : 400);
  }
  return reponse({ resultat: data });
});
