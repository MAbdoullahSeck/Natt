// Retirer un membre : impossible si déjà servie (Fatou), tour supprimé pour Khady (cagnotte recalculée).
module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000001');
  await p.getByText('Tontine des sœurs').locator('visible=true').click();
  await p.getByText('Cagnotte du tour 3').waitFor({ timeout: 15000 });
  // Fatou a reçu le tour 2 : retrait impossible, explication.
  await p.getByText('Fatou', { exact: true }).locator('visible=true').first().click();
  await vis('[data-testid="lien-retirer"]').click();
  await p.getByText('a déjà reçu la cagnotte', { exact: false }).locator('visible=true').waitFor();
  if ((await vis('[data-testid="bouton-retirer-membre"]').count()) > 0) throw new Error('bouton de retrait présent');
  await p.screenshot({ path: `${S}/e2e-retrait-impossible.png` });
  await p.getByRole('button', { name: 'Retour' }).locator('visible=true').click();
  await p.getByRole('button', { name: 'Retour' }).locator('visible=true').click();
  // Khady (tour 4) : tour supprimé.
  await p.getByText('Khady', { exact: true }).locator('visible=true').first().click();
  await vis('[data-testid="lien-retirer"]').click();
  await vis('[data-testid="mode-supprimer"]').click();
  await p.screenshot({ path: `${S}/e2e-retrait.png` });
  await vis('[data-testid="bouton-retirer-membre"]').click();
  await p.getByText(/50\s000\sF/).locator('visible=true').first().waitFor({ timeout: 15000 });
  if ((await p.getByText('Khady', { exact: true }).locator('visible=true').count()) > 0) throw new Error('Khady toujours listée');
  console.log('OK retrait (impossible si servie ; tour supprimé, cagnotte 50 000 F)');
};
