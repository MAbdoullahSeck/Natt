// Edge Function « invitation » : lien https partagé sur WhatsApp (?code=XXXXXX).
// - Site statique configuré (NATT_SITE_URL) : redirection vers web/invitation.html, qui ouvre l'app
//   (natt://rejoindre?code=…) ou propose de la télécharger.
// - Sinon : page en texte simple avec le code et le lien de téléchargement.
import { codeValide, pageTexte } from '../_shared/invitation.ts';

Deno.serve((req) => {
  const code = new URL(req.url).searchParams.get('code');
  const site = Deno.env.get('NATT_SITE_URL');
  if (site && codeValide(code)) {
    return new Response(null, { status: 302, headers: { Location: `${site}/invitation.html?code=${code}` } });
  }
  return new Response(pageTexte(code), {
    status: codeValide(code) ? 200 : 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
});
