module.exports = async (p, { connexion, chiffres, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000001');
  await p.getByText('Tontine des sœurs').locator('visible=true').click();
  await vis('[data-testid="bouton-relancer"]').click();
  await p.getByText('1 relance envoyée').waitFor({ timeout: 15000 });
  await p.getByRole('button', { name: 'Réglages' }).locator('visible=true').click();
  await vis('[data-testid="interrupteur-j-3"]').click();
  await p.getByText('Pénalité de retard').locator('visible=true').click();
  await chiffres(p, '500');
  await p.getByRole('button', { name: 'Enregistrer' }).locator('visible=true').click();
  await p.getByText('500').locator('visible=true').first().waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-reglages.png` });
  console.log('OK gérante réglages');
};
