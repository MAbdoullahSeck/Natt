module.exports = async (p, { connexion, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await connexion(p, '770000004'); // Khady : tour 4 à payer
  await p.getByText('Tontine des sœurs').locator('visible=true').click();
  await vis('[data-testid="bouton-payer"]').click();
  await vis('[data-testid="moyen-orange_money"]').click();
  await p.screenshot({ path: `${S}/e2e-payer.png`, fullPage: true });
  await vis('[data-testid="bouton-payer-avec"]').click();
  await p.getByText('est copié').waitFor();
  await vis('[data-testid="lien-deja-paye"]').click();
  await vis('[data-testid="bouton-terminer"]').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-envoye.png` });
  await vis('[data-testid="bouton-terminer"]').click();
  await p.getByText('Prochain paiement').waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${S}/e2e-membre-apres.png` });
  console.log('OK paiement');
};
