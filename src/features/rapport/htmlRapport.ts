import type { Rapport } from '@/domain/rapport';
import { textes } from '@/i18n';
import { formatDate, formatMoisAnnee, formatMontant } from '@/lib/format';
import { palettes } from '@/theme/couleurs';

const t = textes.rapport;
// Le PDF reste toujours en clair (impression, partage), quel que soit le mode de l'app.
const c = palettes.clair;

export function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type Donnees = {
  nomTontine: string;
  rapport: Rapport;
  prenoms: Record<string, string>;
  genereLe?: Date;
};

/** Rapport du cycle (F2, écran 19b) en HTML, pour expo-print. */
export function htmlRapport({
  nomTontine,
  rapport: r,
  prenoms,
  genereLe = new Date(),
}: Donnees): string {
  const periode =
    r.debut && r.fin ? t.periodeValeur(formatMoisAnnee(r.debut), formatMoisAnnee(r.fin)) : '—';
  const lignes: [string, string][] = [
    [t.tours, String(r.nbTours)],
    [t.periode, periode],
    [t.aLHeure, t.pourcentage(r.pourcentageALHeure)],
    [t.retards, String(r.nbRetards)],
    [t.penalites, formatMontant(r.totalPenalites)],
  ];
  const e = echapperHtml;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${e(t.pdfTitreFichier(nomTontine))}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap" rel="stylesheet" />
<style>
  @page { margin: 24mm 18mm; }
  body { font-family: 'Nunito', 'Helvetica Neue', Arial, sans-serif; color: ${c.texte}; background: ${c.fond}; font-size: 13pt; }
  .logo { color: ${c.terracotta}; font-weight: 700; font-size: 20pt; letter-spacing: 1px; }
  h1 { font-size: 24pt; margin: 8px 0 4px; }
  .secondaire { color: ${c.texteSecondaire}; }
  .total { background: ${c.terracottaClair}; border-radius: 16px; padding: 18px 22px; margin: 18px 0; }
  .total .montant { font-size: 30pt; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; }
  td, th { padding: 9px 4px; border-bottom: 1px solid ${c.separateur}; text-align: left; }
  td.valeur, th.valeur { text-align: right; font-weight: 700; }
  .vert { color: ${c.vert}; }
  .terracotta { color: ${c.terracotta}; }
  h2 { font-size: 16pt; margin: 22px 0 4px; }
  .pied { margin-top: 28px; font-size: 10pt; color: ${c.texteSecondaire}; }
</style>
</head>
<body>
  <div class="logo">Natt</div>
  <h1>${e(t.titre)}</h1>
  <div class="secondaire">${e(nomTontine)}</div>
  <div class="total">
    <div class="secondaire">${e(t.totalVerse)}</div>
    <div class="montant">${e(formatMontant(r.totalVerse))}</div>
  </div>
  <table>
    ${lignes.map(([l, v]) => `<tr><td>${e(l)}</td><td class="valeur">${e(v)}</td></tr>`).join('\n    ')}
  </table>
  <h2>${e(t.ponctualite)}</h2>
  <table>
    <tr><th>${e(t.pdfMembre)}</th><th class="valeur">${e(t.pdfALHeure)}</th><th class="valeur">${e(t.pdfEnRetard)}</th></tr>
    ${r.ponctualite
      .map(
        (p) =>
          `<tr><td>${e(prenoms[p.membreId] ?? '—')}</td><td class="valeur vert">${p.aLHeure}</td><td class="valeur terracotta">${p.enRetard}</td></tr>`,
      )
      .join('\n    ')}
  </table>
  <div class="pied">${e(t.pdfGenere(formatDate(genereLe, { annee: true })))} · ${e(t.pdfRappel)}</div>
</body>
</html>`;
}
