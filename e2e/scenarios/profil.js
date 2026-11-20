module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000001');
  await vis('[data-testid="onglet-profil"]').click();
  await p.getByText('Gérante fondatrice').locator('visible=true').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-profil.png` });
  await p.getByText('Mes données').locator('visible=true').click();
  await vis('[data-testid="bouton-retirer"]').waitFor();
  await p.screenshot({ path: `${S}/e2e-donnees.png` });
  await p.getByRole('button', { name: 'Retour' }).locator('visible=true').click();
  await vis('[data-testid="bouton-deconnecter"]').click();
  await vis('[data-testid="bouton-recevoir-code"]').waitFor({ timeout: 15000 });
  console.log('OK profil + déconnexion');
};
