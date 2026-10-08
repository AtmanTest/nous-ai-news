import { expect, test } from '@playwright/test';
import { trackErrors } from '../../support/e2e';

const MAIN_PAGES = [
  { path: '/', title: /Nous AI News/, h1: 'Nous AI News' },
  { path: '/topics', title: /^Thématiques · Nous AI News$/, h1: 'Thématiques' },
  { path: '/bookmarks', title: /^Favoris · Nous AI News$/, h1: 'Mes favoris' },
  { path: '/newsletter', title: /^Newsletter · Nous AI News$/, h1: 'Newsletter' },
  { path: '/search', title: /^Recherche · Nous AI News$/, h1: 'Recherche' },
] as const;

test.describe('Plateforme — navigation globale', () => {
  test('PLT-E2E-001 @smoke @REQ-PLT-03 les liens de navigation principale mènent aux bonnes pages', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });

    await nav.getByRole('link', { name: 'Thématiques' }).click();
    await expect(page).toHaveURL(/\/topics$/);

    await nav.getByRole('link', { name: 'Favoris' }).click();
    await expect(page).toHaveURL(/\/bookmarks$/);

    await nav.getByRole('link', { name: 'Newsletter' }).click();
    await expect(page).toHaveURL(/\/newsletter$/);

    await nav.getByRole('link', { name: 'Accueil' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('PLT-E2E-002 @REQ-PLT-03 le logo ramène à l’accueil depuis n’importe quelle page', async ({ page }) => {
    await page.goto('/topics/agents');
    await page.getByTestId('site-header').getByRole('link', { name: 'Nous AI News' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('PLT-E2E-003 @REQ-PLT-03 une URL inconnue affiche la page 404 avec statut 404 et lien de retour', async ({ page }) => {
    const response = await page.goto('/cette-page-nexiste-pas');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeVisible();
    await page.getByRole('link', { name: 'Retour à l’accueil' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  for (const { path, title, h1 } of MAIN_PAGES) {
    test(`PLT-E2E-004 @REQ-PLT-03 ${path} : titre de page propre, un seul <h1>, langue française`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    });
  }

  test('PLT-E2E-005 @REQ-PLT-04 lien d’évitement : premier Tab → « Aller au contenu », Entrée → focus sur le contenu', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#contenu$/);
    await expect(page.locator('#contenu')).toBeFocused();
  });

  test('PLT-E2E-006 @REQ-PLT-02 le pied de page signale le contenu de démonstration et expose le flux RSS', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByTestId('site-footer');
    await expect(footer.getByTestId('demo-notice')).toContainText('Contenu de démonstration');
    await expect(footer.getByRole('link', { name: 'Flux RSS' })).toHaveAttribute('href', '/feed.xml');
  });

  test('PLT-E2E-007 @REQ-PLT-02 la balise <link rel="alternate"> annonce le flux RSS (auto-découverte)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', '/feed.xml');
  });

  test('PLT-E2E-008 @smoke @REQ-PLT-03 aucune erreur console ni exception JS sur les pages principales', async ({ page }) => {
    const errors = trackErrors(page);
    for (const { path } of MAIN_PAGES) await page.goto(path);
    await page.goto('/articles/agents-codage-revue-humaine');
    await page.goto('/topics/agents');
    expect(errors).toEqual([]);
  });

  test('PLT-E2E-009 @REQ-PLT-03 la navigation précédente/suivante du navigateur restaure les pages', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('article-card').first().getByRole('link').click();
    await expect(page).toHaveURL(/\/articles\//);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('article-card')).toHaveCount(9);

    await page.goForward();
    await expect(page).toHaveURL(/\/articles\//);
  });
});
