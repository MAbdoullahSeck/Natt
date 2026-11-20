import type { Rapport } from '@/domain/rapport';

import { echapperHtml, htmlRapport } from './htmlRapport';

const rapport: Rapport = {
  totalVerse: 360000,
  nbTours: 6,
  nbToursVerses: 6,
  debut: '2026-09-05',
  fin: '2027-02-05',
  pourcentageALHeure: 94,
  nbRetards: 2,
  totalPenalites: 1000,
  ponctualite: [
    { membreId: 'a', aLHeure: 6, enRetard: 0 },
    { membreId: 'b', aLHeure: 4, enRetard: 2 },
  ],
};

describe('rapport du cycle en PDF (HTML)', () => {
  const html = htmlRapport({
    nomTontine: 'Tontine des sœurs <test>',
    rapport,
    prenoms: { a: 'Aminata', b: 'Moussa' },
    genereLe: new Date(2027, 1, 6),
  });
  const texte = html.replace(/[  ]/g, ' ');

  it('contient tous les chiffres du rapport', () => {
    for (const attendu of [
      '360 000 F',
      'Sept. 2026 → Févr. 2027',
      '94 %',
      '1 000 F',
      '6 février 2027',
    ]) {
      expect(texte).toContain(attendu);
    }
    expect(texte).toMatch(/Nombre de tours<\/td><td class="valeur">6/);
    expect(texte).toMatch(/Retards<\/td><td class="valeur">2/);
  });

  it('détail par membre', () => {
    expect(html).toContain(
      '<td>Aminata</td><td class="valeur vert">6</td><td class="valeur terracotta">0</td>',
    );
    expect(html).toContain(
      '<td>Moussa</td><td class="valeur vert">4</td><td class="valeur terracotta">2</td>',
    );
  });

  it('aux couleurs de Natt, toujours en clair', () => {
    expect(html).toContain('#C65D3B');
    expect(html).toContain('background: #FFFFFF');
  });

  it('échappe les noms', () => {
    expect(html).toContain('Tontine des sœurs &lt;test&gt;');
    expect(html).not.toContain('<test>');
    expect(echapperHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });
});
