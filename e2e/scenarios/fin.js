module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000001');
  await p.getByText('Tontine des sœurs').locator('visible=true').click();
  await vis('[data-testid="bouton-verse"]').click();
  await p.getByText('Cycle terminé').locator('visible=true').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-fin.png` });
  await vis('[data-testid="bouton-rapport"]').click();
  await p.getByText('Ponctualité par membre').locator('visible=true').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-rapport.png`, fullPage: true });
  await p.getByRole('button', { name: 'Retour' }).locator('visible=true').click();
  await vis('[data-testid="bouton-relancer-cycle"]').click();
  await vis('[data-testid="bouton-confirmer-relance"]').click();
  await vis('[data-testid="code-invitation"]').waitFor({ timeout: 15000 });
  console.log('OK fin de cycle, nouveau code', await vis('[data-testid="code-invitation"]').textContent());
};
