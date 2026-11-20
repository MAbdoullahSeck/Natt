module.exports = async (p, { connexion, S }) => {
  await connexion(p, '770000001');
  await p.getByText('Tontine des sœurs').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-accueil.png` });
  console.log('OK accueil');
};
