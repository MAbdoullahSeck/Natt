/**
 * PayTech (https://paytech.sn) — logique pure, sans dépendance, testée avec Jest.
 * Les clés ne sont jamais écrites dans le code : elles viennent des secrets des Edge Functions
 * (PAYTECH_API_KEY, PAYTECH_API_SECRET, PAYTECH_ENV).
 */
export const URL_DEMANDE_PAIEMENT = 'https://paytech.sn/api/payment/request-payment';

export async function sha256Hex(texte: string): Promise<string> {
  const empreinte = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return Array.from(new Uint8Array(empreinte), (o) => o.toString(16).padStart(2, '0')).join('');
}

/** Comparaison à temps constant (évite de révéler la position de la première différence). */
export function egaliteSure(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Authenticité d'une IPN : PayTech envoie SHA-256(clé API) et SHA-256(clé secrète) ;
 * on les recalcule et on compare. Toute IPN qui ne correspond pas est refusée.
 */
export async function ipnAuthentique(
  champs: Record<string, string | undefined>,
  cleApi: string,
  cleSecrete: string,
): Promise<boolean> {
  if (!cleApi || !cleSecrete) return false;
  const recuApi = (champs.api_key_sha256 ?? '').toLowerCase();
  const recuSecret = (champs.api_secret_sha256 ?? '').toLowerCase();
  const [attenduApi, attenduSecret] = await Promise.all([sha256Hex(cleApi), sha256Hex(cleSecrete)]);
  return egaliteSure(recuApi, attenduApi) && egaliteSure(recuSecret, attenduSecret);
}

/** Lit le corps d'une IPN (formulaire ou JSON) en dictionnaire de chaînes. */
export async function lireChampsIpn(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const json = await req.json();
    return Object.fromEntries(Object.entries(json ?? {}).map(([k, v]) => [k, String(v ?? '')]));
  }
  const texte = await req.text();
  return Object.fromEntries(new URLSearchParams(texte));
}

export type DemandePaiement = {
  montant: number;
  refCommand: string;
  palier: string;
  periodicite: string;
  urlIpn: string;
  urlSucces: string;
  urlAnnulation: string;
  env: string;
};

/** Corps de la demande de paiement PayTech. */
export function corpsDemande(d: DemandePaiement): Record<string, string | number> {
  const nomPalier = d.palier === 'illimite' ? 'Illimité' : d.palier.charAt(0).toUpperCase() + d.palier.slice(1);
  return {
    item_name: `Abonnement Natt ${nomPalier} (${d.periodicite === 'annuel' ? '1 an' : '1 mois'})`,
    item_price: d.montant,
    currency: 'XOF',
    ref_command: d.refCommand,
    command_name: `Natt — abonnement ${nomPalier} ${d.periodicite}`,
    env: d.env === 'prod' ? 'prod' : 'test',
    ipn_url: d.urlIpn,
    success_url: d.urlSucces,
    cancel_url: d.urlAnnulation,
    custom_field: JSON.stringify({ ref_command: d.refCommand }),
  };
}
