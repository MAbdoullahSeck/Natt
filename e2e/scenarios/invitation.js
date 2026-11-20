// Lien d'invitation ouvert avant d'avoir un compte : inscription puis arrivée directe sur l'écran 12c.
module.exports = async (p, { chiffres, S }) => {
  const vis = (sel) => p.locator(sel + ':visible');
  await p.goto('http://localhost:8099/rejoindre?code=903318');
  await vis('[data-testid="bouton-recevoir-code"]').waitFor({ timeout: 15000 });
  await chiffres(p, '770000017');
  await vis('[data-testid="bouton-recevoir-code"]').click();
  await vis('[data-testid="case-code-0"]').waitFor();
  await chiffres(p, '123456');
  await vis('input').waitFor({ timeout: 15000 });
  await vis('input').fill('Astou');
  await p.getByRole('button', { name: 'Continuer' }).locator('visible=true').click();
  await vis('[data-testid="case-consentement"]').click();
  await vis('[data-testid="bouton-creer-compte"]').click();
  await p.getByText('Tontine du marché').locator('visible=true').first().waitFor({ timeout: 15000 });
  await vis('[data-testid="case-reglement"]').waitFor();
  await p.screenshot({ path: `${S}/e2e-invitation.png` });
  // Lien invalide une fois connectée : message de l'écran 12b.
  await p.goto('http://localhost:8099/rejoindre?code=000000');
  await vis('[data-testid="erreur-code"]').waitFor({ timeout: 15000 });
  console.log('OK lien d’invitation (avant connexion → 12c ; code inconnu → 12b)');
};
