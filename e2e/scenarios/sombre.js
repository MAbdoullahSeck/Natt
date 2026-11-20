// Mode sombre (préférence du téléphone) : captures des écrans principaux, puis choix « Clair » mémorisé.
module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await p.goto('http://localhost:8099/');
  await vis('[data-testid="bouton-recevoir-code"]').waitFor();
  await p.screenshot({ path: `${S}/sombre-telephone.png` });
  await connexion(p, '770000001');
  await p.getByText('Tontine des sœurs').locator('visible=true').waitFor({ timeout: 15000 });
  const fond = await vis('[data-testid="bouton-creer"]').evaluate((e) => getComputedStyle(e).backgroundColor);
  await p.screenshot({ path: `${S}/sombre-accueil.png` });
  await p.getByText('Tontine des sœurs').locator('visible=true').click();
  await p.getByText('Cagnotte du tour 3').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/sombre-gerante.png`, fullPage: true });
  await p.getByRole('button', { name: 'Retour' }).locator('visible=true').click();
  await vis('[data-testid="onglet-notifications"]').click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${S}/sombre-notifications.png` });
  await vis('[data-testid="onglet-profil"]').click();
  await vis('[data-testid="ligne-apparence"]').click();
  await p.screenshot({ path: `${S}/sombre-apparence.png` });
  await vis('[data-testid="apparence-clair"]').click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${S}/sombre-vers-clair.png` });
  await p.reload();
  await vis('[data-testid="apparence-clair"]').waitFor({ timeout: 15000 });
  // Option sélectionnée en clair : fond terracottaClair (#FAF4F0), alors que le téléphone est en sombre.
  const fondOption = await vis('[data-testid="apparence-clair"]').evaluate((e) => getComputedStyle(e).backgroundColor);
  if (fondOption !== 'rgb(250, 244, 240)') throw new Error(`choix « Clair » non mémorisé (${fondOption})`);
  if (fond !== 'rgb(181, 83, 47)') throw new Error(`bouton principal sombre inattendu : ${fond}`);
  console.log('OK mode sombre (bouton', fond, ') ; choix « Clair » mémorisé');
};
