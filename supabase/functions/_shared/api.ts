/**
 * Accès minimal à Supabase depuis les Edge Functions, sans dépendance externe :
 * appels HTTP directs à Auth et PostgREST avec la clé service_role.
 */
const URL_SUPABASE = Deno.env.get('SUPABASE_URL')!;
const CLE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CLE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function reponse(corps: unknown, statut = 200): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Utilisatrice correspondant au jeton de la requête, ou null. */
export async function utilisatrice(req: Request): Promise<{ id: string } | null> {
  const autorisation = req.headers.get('Authorization');
  if (!autorisation) return null;
  const r = await fetch(`${URL_SUPABASE}/auth/v1/user`, {
    headers: { Authorization: autorisation, apikey: CLE_ANON },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.id ? { id: u.id } : null;
}

const enTetesService = {
  apikey: CLE_SERVICE,
  Authorization: `Bearer ${CLE_SERVICE}`,
  'Content-Type': 'application/json',
};

/** Appel d'une fonction SQL (RPC) avec service_role. */
export async function rpc<T>(nom: string, params: Record<string, unknown>): Promise<{ data?: T; error?: string }> {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/rpc/${nom}`, {
    method: 'POST',
    headers: enTetesService,
    body: JSON.stringify(params),
  });
  const corps = await r.json().catch(() => null);
  if (!r.ok) return { error: corps?.message ?? `erreur_${r.status}` };
  return { data: corps as T };
}

/** Lecture PostgREST avec service_role (ex. `membres?select=id&tontine_id=eq.…`). */
export async function lire<T>(chemin: string): Promise<T> {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/${chemin}`, { headers: enTetesService });
  if (!r.ok) throw new Error(`lecture_${r.status}`);
  return (await r.json()) as T;
}

/** Mise à jour PostgREST avec service_role. */
export async function modifier(chemin: string, valeurs: Record<string, unknown>): Promise<void> {
  const r = await fetch(`${URL_SUPABASE}/rest/v1/${chemin}`, {
    method: 'PATCH',
    headers: enTetesService,
    body: JSON.stringify(valeurs),
  });
  if (!r.ok) throw new Error(`modification_${r.status}`);
}
