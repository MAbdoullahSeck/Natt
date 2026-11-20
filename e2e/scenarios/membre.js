module.exports = async (p, { connexion, S }) => {
  await connexion(p, '770000003');
  await p.getByText('Tontine des sœurs').locator('visible=true').click();
  await p.getByText('Prochain paiement').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-membre.png`, fullPage: true });
  console.log('OK membre');
};
