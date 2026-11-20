module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000001');
  await p.getByText('Trio du quartier').locator('visible=true').click();
  await p.getByRole('button', { name: 'Tours' }).locator('visible=true').click();
  await vis('[data-testid="bouton-tirage"]').click();
  await p.getByRole('heading', { name: 'Résultat du tirage' }).waitFor({ timeout: 30000 });
  await p.screenshot({ path: `${S}/e2e-tirage.png` });
  await p.getByRole('button', { name: 'Retour' }).locator('visible=true').click();
  // Échange : appui long sur la première ligne.
  const ligne = p.getByText('27 novembre').locator('visible=true').first();
  await ligne.hover();
  await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up();
  await p.getByText('Tour à déplacer').waitFor({ timeout: 10000 });
  await p.locator('[role="radio"]:visible').first().click();
  await p.screenshot({ path: `${S}/e2e-echanger.png` });
  await vis('[data-testid="bouton-echanger"]').click();
  await p.getByText('Ordre des tours').waitFor();
  await p.screenshot({ path: `${S}/e2e-tours.png` });
  console.log('OK tours');
};
