/**
 * Tests de bout en bout sur l'export web de l'app, contre la base Supabase locale.
 * Prérequis : stack locale Docker (`npm run db:local:start`), `npx supabase functions serve` (pour le tirage),
 * Playwright installé. Les scénarios modifient la base : ils ne tournent jamais sur natt-dev.
 * Usage : npm run e2e              (tous les scénarios)
 *         npm run e2e -- tours     (un scénario)
 * Chaque scénario repart d'une base réinitialisée (seed) et, si besoin, d'une préparation SQL.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RACINE = path.resolve(__dirname, '..');
const DIST = path.join(__dirname, '.dist');
const CAPTURES = path.join(__dirname, 'captures');
const BASE = 'http://localhost:8099';
const DB = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// Ordre et préparation SQL éventuelle de chaque scénario.
const SCENARIOS = [
  ['accueil'],
  ['creation'],
  ['inscription_rejoindre'],
  ['membre'],
  ['gerante'],
  ['paiement'],
  ['tours', 'tours.sql'],
  ['reglages'],
  ['notifs_membre', null, { pasDeReset: true }],
  ['fin', 'fin.sql'],
  ['abonnement'],
  ['invitation'],
  ['retrait'],
  ['sombre', null, { sombre: true }],
  ['profil'],
];

async function chiffres(p, s) {
  for (const c of s) await p.locator(`[data-testid="touche-${c}"]:visible`).click();
}

async function connexion(p, numero) {
  await p.goto(BASE + '/');
  await p.locator('[data-testid="bouton-recevoir-code"]:visible').waitFor();
  await chiffres(p, numero);
  await p.locator('[data-testid="bouton-recevoir-code"]:visible').click();
  await p.locator('[data-testid="case-code-0"]:visible').waitFor();
  await chiffres(p, '123456');
}

async function main() {
  const filtre = process.argv[2];
  fs.mkdirSync(CAPTURES, { recursive: true });
  execSync(`npx expo export --platform web --output-dir ${DIST}`, {
    cwd: RACINE,
    stdio: 'ignore',
    env: {
      ...process.env,
      CI: '1',
      EXPO_OFFLINE: '1',
      // Toujours la stack locale (clé publique de démonstration de la CLI Supabase).
      EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
    },
  });
  const serveur = spawn('node', [path.join(__dirname, 'serveur.js'), DIST, '8099'], { stdio: 'ignore' });
  const navigateur = await chromium.launch();
  let echecs = 0;
  try {
    for (const [nom, preparation, options = {}] of SCENARIOS) {
      if (filtre && filtre !== nom) continue;
      if (!options.pasDeReset) execSync('npx supabase db reset', { cwd: RACINE, stdio: 'ignore' });
      if (preparation)
        execSync(`psql ${DB} -q -f ${path.join(__dirname, 'preparations', preparation)}`, { stdio: 'ignore' });
      const page = await navigateur.newPage({
        viewport: { width: 390, height: 844 },
        colorScheme: options.sombre ? 'dark' : 'light',
      });
      const erreurs = [];
      page.on('pageerror', (e) => erreurs.push(e.message));
      try {
        await require(`./scenarios/${nom}.js`)(page, { connexion, chiffres, S: CAPTURES });
        if (erreurs.length) throw new Error(`erreurs JS : ${erreurs.join(' | ')}`);
      } catch (e) {
        echecs += 1;
        console.log(`ÉCHEC ${nom} : ${e.message.split('\n')[0]}`);
        await page.screenshot({ path: path.join(CAPTURES, `echec-${nom}.png`) });
      }
      await page.close();
    }
  } finally {
    await navigateur.close();
    serveur.kill();
  }
  console.log(echecs ? `${echecs} scénario(s) en échec` : 'Tous les scénarios e2e passent');
  process.exit(echecs ? 1 : 0);
}

main();
