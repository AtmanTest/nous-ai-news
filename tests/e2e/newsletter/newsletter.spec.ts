import { expect, test, type Page } from '@playwright/test';
import { uniqueEmail } from '../../support/seed';

async function openForm(page: Page) {
  await page.goto('/newsletter');
  await expect(page.getByTestId('newsletter-form')).toHaveAttribute('data-hydrated', 'true');
}

const emailInput = (page: Page) => page.getByLabel('Adresse e-mail');
const consentBox = (page: Page) => page.getByRole('checkbox', { name: /accepte de recevoir/ });
const submit = (page: Page) => page.getByRole('button', { name: /inscrire|Envoi/ });

test.describe('Newsletter — inscription', () => {
  test('NEW-E2E-001 @smoke @REQ-NEW-01 une inscription valide affiche la confirmation et vide le formulaire', async ({ page }) => {
    await openForm(page);
    await emailInput(page).fill(uniqueEmail());
    await consentBox(page).check();
    await submit(page).click();

    await expect(page.getByTestId('newsletter-status')).toHaveText('Merci ! Votre inscription est confirmée.');
    await expect(emailInput(page)).toHaveValue('');
    await expect(consentBox(page)).not.toBeChecked();
  });

  test('NEW-E2E-002 @REQ-NEW-02 e-mail invalide : message d’erreur lié au champ (aria-invalid + aria-describedby)', async ({ page }) => {
    await openForm(page);
    await emailInput(page).fill('pas-un-email');
    await consentBox(page).check();
    await submit(page).click();

    const error = page.getByTestId('newsletter-error-email');
    await expect(error).toContainText('format');
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(emailInput(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(emailInput(page)).toHaveAttribute('aria-describedby', 'newsletter-email-error');
    await expect(page.getByTestId('newsletter-status')).toBeEmpty();
  });

  test('NEW-E2E-003 @REQ-NEW-02 consentement manquant : erreur sur la case, pas sur l’e-mail', async ({ page }) => {
    await openForm(page);
    await emailInput(page).fill(uniqueEmail());
    await submit(page).click();

    await expect(page.getByTestId('newsletter-error-consent')).toContainText('consentement est obligatoire');
    await expect(page.getByTestId('newsletter-error-email')).toHaveCount(0);
    await expect(page.getByTestId('newsletter-status')).toBeEmpty();
  });

  test('NEW-E2E-004 @REQ-NEW-02 formulaire vide : toutes les erreurs sont affichées ensemble', async ({ page }) => {
    await openForm(page);
    await submit(page).click();

    await expect(page.getByTestId('newsletter-error-email')).toContainText('requise');
    await expect(page.getByTestId('newsletter-error-consent')).toBeVisible();
  });

  test('NEW-E2E-005 @REQ-NEW-02 corriger puis renvoyer : les erreurs disparaissent et l’inscription aboutit', async ({ page }) => {
    await openForm(page);
    await emailInput(page).fill('invalide');
    await submit(page).click();
    await expect(page.getByTestId('newsletter-error-email')).toBeVisible();
    await expect(page.getByTestId('newsletter-error-consent')).toBeVisible();

    await emailInput(page).fill(uniqueEmail());
    await consentBox(page).check();
    await submit(page).click();

    await expect(page.getByTestId('newsletter-status')).toContainText('inscription est confirmée');
    await expect(page.getByTestId('newsletter-error-email')).toHaveCount(0);
    await expect(page.getByTestId('newsletter-error-consent')).toHaveCount(0);
  });

  test('NEW-E2E-006 @REQ-NEW-03 s’inscrire deux fois avec la même adresse : message « déjà inscrit »', async ({ page }) => {
    const email = uniqueEmail();
    await openForm(page);

    await emailInput(page).fill(email);
    await consentBox(page).check();
    await submit(page).click();
    await expect(page.getByTestId('newsletter-status')).toContainText('inscription est confirmée');

    await emailInput(page).fill(email.toUpperCase()); // casse différente : même adresse
    await consentBox(page).check();
    await submit(page).click();
    await expect(page.getByTestId('newsletter-status')).toHaveText('Vous êtes déjà inscrit(e) avec cette adresse.');
  });

  test('NEW-E2E-007 @REQ-NEW-01 les thématiques cochées sont envoyées à l’API', async ({ page }) => {
    await openForm(page);
    const requestPromise = page.waitForRequest('**/api/newsletter/subscribe');

    await emailInput(page).fill(uniqueEmail());
    await page.getByRole('checkbox', { name: 'Agents IA' }).check();
    await page.getByRole('checkbox', { name: 'Régulation' }).check();
    await consentBox(page).check();
    await submit(page).click();

    const payload = (await requestPromise).postDataJSON();
    expect(payload.topics.sort()).toEqual(['agents', 'policy']);
    expect(payload.consent).toBe(true);
    await expect(page.getByTestId('newsletter-status')).toContainText('inscription est confirmée');
  });

  test('NEW-E2E-008 @REQ-NEW-01 pendant l’envoi, le bouton est désactivé (anti double soumission)', async ({ page }) => {
    await page.route('**/api/newsletter/subscribe', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });
    await openForm(page);
    await emailInput(page).fill(uniqueEmail());
    await consentBox(page).check();
    await submit(page).click();

    await expect(page.getByRole('button', { name: 'Envoi…' })).toBeDisabled();
    await expect(page.getByTestId('newsletter-status')).toContainText('inscription est confirmée');
    await expect(page.getByRole('button', { name: /inscrire/ })).toBeEnabled();
  });

  test('NEW-E2E-009 @REQ-NEW-02 erreur serveur 500 : message générique, formulaire conservé', async ({ page }) => {
    await page.route('**/api/newsletter/subscribe', (route) => route.fulfill({ status: 500, body: 'boom' }));
    await openForm(page);
    const email = uniqueEmail();
    await emailInput(page).fill(email);
    await consentBox(page).check();
    await submit(page).click();

    await expect(page.getByTestId('newsletter-status')).toContainText('Une erreur est survenue');
    await expect(emailInput(page)).toHaveValue(email); // la saisie n'est pas perdue
  });

  test('NEW-E2E-010 @REQ-NEW-02 réseau coupé : message générique, pas de plantage', async ({ page }) => {
    await page.route('**/api/newsletter/subscribe', (route) => route.abort('failed'));
    await openForm(page);
    await emailInput(page).fill(uniqueEmail());
    await consentBox(page).check();
    await submit(page).click();

    await expect(page.getByTestId('newsletter-status')).toContainText('Une erreur est survenue');
  });

  test('NEW-E2E-011 @REQ-NEW-01 parcours 100 % clavier : Tab, saisie, espace sur la case, Entrée', async ({ page }) => {
    await openForm(page);
    await emailInput(page).focus();
    await page.keyboard.type(uniqueEmail());
    // Tab ×7 : les 6 thématiques puis la case de consentement.
    for (let i = 0; i < 7; i++) await page.keyboard.press('Tab');
    await expect(consentBox(page)).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('newsletter-status')).toContainText('inscription est confirmée');
  });

  test('NEW-E2E-012 @REQ-NEW-02 un e-mail contenant du HTML est refusé et jamais interprété', async ({ page }) => {
    await openForm(page);
    await emailInput(page).fill('<img src=x onerror=alert(1)>@x.fr');
    await consentBox(page).check();
    await submit(page).click();

    await expect(page.getByTestId('newsletter-error-email')).toBeVisible();
    await expect(page.locator('main img')).toHaveCount(0);
  });
});
