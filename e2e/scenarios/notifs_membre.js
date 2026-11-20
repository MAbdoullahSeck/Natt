module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000003');
  await p.getByText('Tontine des sœurs').locator('visible=true').waitFor({ timeout: 15000 });
  await vis('[data-testid="onglet-notifications"]').click();
  await p.getByText('Nouveau règlement').locator('visible=true').first().waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-notifications.png` });
  await p.getByText('Nouveau règlement').locator('visible=true').first().click();
  await vis('[data-testid="bouton-accepter-reglement"]').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-accepter.png` });
  await p.getByRole('checkbox').locator('visible=true').click();
  await vis('[data-testid="bouton-accepter-reglement"]').click();
  await p.getByText('Prochain paiement').locator('visible=true').waitFor({ timeout: 15000 });
  console.log('OK membre notifications + règlement');
};
