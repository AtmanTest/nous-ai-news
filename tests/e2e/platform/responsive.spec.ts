import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from '../../support/e2e';
import { KNOWN_ARTICLE } from '../../support/seed';

const PAGES = ['/', '/?page=2', `/articles/${KNOWN_ARTICLE.slug}`, '/search?q=agents', '/topics', '/topics/agents', '/bookmarks', '/newsletter'];

/** [REQ-PLT-05] Responsive — exécuté en desktop et en mobile (Pixel 7, projet e2e-mobile). */
test.describe('Plateforme — responsive', () => {
  for (const path of PAGES) {
    test(`PLT-E2E-030 @mobile @REQ-PLT-05 ${path} : aucun défilement horizontal`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test('PLT-E2E-031 @mobile @REQ-PLT-05 en-tête : navigation et recherche restent visibles et utilisables', async ({ page }) => {
    await page.goto('/');
    const header = page.getByTestId('site-header');
    for (const name of ['Accueil', 'Thématiques', 'Favoris', 'Newsletter']) {
      await expect(header.getByRole('link', { name })).toBeVisible();
    }
    await expect(header.getByRole('searchbox', { name: 'Rechercher un article' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Rechercher' })).toBeVisible();
  });

  test('PLT-E2E-032 @mobile @REQ-PLT-05 les cartes occupent la largeur disponible sans être tronquées', async ({ page }) => {
    await page.goto('/');
    const viewportWidth = page.viewportSize()?.width ?? 0;
    const box = await page.getByTestId('article-card').first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth);
  });

  test('PLT-E2E-033 @mobile @REQ-PLT-05 la balise viewport est définie (rendu mobile correct)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  });
});
