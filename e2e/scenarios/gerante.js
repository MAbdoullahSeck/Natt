module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000001');
  await p.getByText('Tontine des sœurs').locator('visible=true').click();
  await p.getByText('Cagnotte du tour 3').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-gerante.png`, fullPage: true });
  // Moussa est en retard : marquer payé.
  const ligneMoussa = p.getByRole('button', { name: /Moussa/ }).locator('visible=true');
  await ligneMoussa.getByText('Marquer payé').click();
  await vis('[data-testid="bouton-confirmer"]').waitFor();
  await p.screenshot({ path: `${S}/e2e-confirmer.png` });
  await vis('[data-testid="bouton-confirmer"]').click();
  await vis('[data-testid="bouton-verse"]').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-gerante-tout-paye.png`, fullPage: true });
  await vis('[data-testid="bouton-verse"]').click();
  await p.getByText('Cagnotte du tour 4').waitFor({ timeout: 15000 });
  // Historique de Moussa
  await p.getByText('Moussa').locator('visible=true').first().click();
  await p.getByText('Historique').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-historique.png`, fullPage: true });
  console.log('OK gérante');
};
