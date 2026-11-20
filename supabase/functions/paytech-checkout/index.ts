// Edge Function « paytech-checkout » : ouverte depuis le lien de paiement envoyé à la gérante (hors de l'app).
// Vérifie la signature et l'expiration du lien (en SQL), crée la commande, demande le paiement à PayTech
// puis redirige vers la page de paiement PayTech. Aucune page HTML ici (le domaine *.supabase.co
// sert le HTML en texte brut) : les erreurs redirigent vers le site statique ou l'app.
import { rpc } from '../_shared/api.ts';
import { corpsDemande, URL_DEMANDE_PAIEMENT } from '../_shared/paytech.ts';

const URL_SUPABASE = Deno.env.get('SUPABASE_URL')!;
const SITE = Deno.env.get('NATT_SITE_URL') ?? '';

function vers(page: 'succes' | 'annule' | 'erreur', code?: string): Response {
  const url = SITE
    ? `${SITE}/paiement-${page}.html${code ? `?code=${encodeURIComponent(code)}` : ''}`
    : `natt://abonnement?paiement=${page}${code ? `&code=${encodeURIComponent(code)}` : ''}`;
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  const p = new URL(req.url).searchParams;
  const { data: paiement, error } = await rpc<{ id: string; montant: number; ref_command: string; palier: string; periodicite: string }>(
    'creer_paiement_abonnement',
    {
      p_profil_id: p.get('g'),
      p_palier: p.get('p'),
      p_periodicite: p.get('d'),
      p_expire: Number(p.get('e')),
      p_signature: p.get('s'),
    },
  );
  if (error || !paiement) return vers('erreur', error?.includes('expire') ? 'lien_expire' : 'lien_invalide');

  const cleApi = Deno.env.get('PAYTECH_API_KEY') ?? '';
  const cleSecrete = Deno.env.get('PAYTECH_API_SECRET') ?? '';
  const retour = SITE ? `${SITE}/paiement-` : 'natt://abonnement?paiement=';
  const corps = corpsDemande({
    montant: paiement.montant,
    refCommand: paiement.ref_command,
    palier: paiement.palier,
    periodicite: paiement.periodicite,
    urlIpn: `${URL_SUPABASE}/functions/v1/paytech-ipn`,
    urlSucces: SITE ? `${retour}succes.html` : `${retour}succes`,
    urlAnnulation: SITE ? `${retour}annule.html` : `${retour}annule`,
    env: Deno.env.get('PAYTECH_ENV') ?? 'test',
  });

  const r = await fetch(URL_DEMANDE_PAIEMENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', API_KEY: cleApi, API_SECRET: cleSecrete },
    body: JSON.stringify(corps),
  });
  const reponse = await r.json().catch(() => null);
  const redirection = reponse?.redirect_url ?? reponse?.redirectUrl;
  if (!r.ok || reponse?.success !== 1 || !redirection) {
    console.error('PayTech request-payment', r.status, JSON.stringify(reponse));
    return vers('erreur', 'paytech_indisponible');
  }
  await rpc('enregistrer_token_paytech', { p_paiement_id: paiement.id, p_token: String(reponse.token ?? '') });
  return new Response(null, { status: 302, headers: { Location: redirection } });
});
