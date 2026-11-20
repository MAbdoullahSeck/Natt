// Upsell (limite atteinte) → écran Abonnement sans bouton de paiement, prix barré en annuel.
module.exports = async (p, { connexion, chiffres, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  const continuer = async () => {
    await p.waitForTimeout(500);
    await p.getByRole('button', { name: 'Continuer' }).locator('visible=true').click();
  };
  await connexion(p, '770000016');
  await vis('input').waitFor({ timeout: 15000 });
  await vis('input').fill('Ndèye');
  await continuer();
  await vis('[data-testid="case-consentement"]').click();
  await vis('[data-testid="bouton-creer-compte"]').click();
  await vis('[data-testid="bouton-creer"]').click();
  await vis('input').fill('Ma première');
  await continuer(); await continuer();
  await chiffres(p, '1000'); await continuer(); await continuer();
  await chiffres(p, '4'); await continuer();
  await vis('[data-testid="bouton-creer-tontine"]').click();
  await p.getByText('Nous t’avons envoyé par notification', { exact: false }).first().locator('visible=true').waitFor({ timeout: 15000 });
  const boutonsPaiement = await p.getByRole('button', { name: /payer|choisir/i }).locator('visible=true').count();
  if (boutonsPaiement > 0) throw new Error('bouton de paiement présent dans l’app');
  await vis('[data-testid="periodicite-annuel"]').click();
  await vis('[data-testid="prix-barre"]').first().waitFor();
  const barre = await vis('[data-testid="prix-pro-annuel"] [data-testid="prix-barre"]').textContent();
  if (!barre.replace(/\s/g, '').startsWith('30000')) throw new Error(`prix barré inattendu : ${barre}`);
  await p.screenshot({ path: `${S}/e2e-abonnement.png`, fullPage: true });
  console.log('OK upsell sans bouton de paiement, prix barré', barre);
};
