import { expect, test } from '@playwright/test';
import { hrefsOf, trackErrors } from '../../support/e2e';
import { SEED } from '../../support/seed';

test.describe('Articles — page d’accueil', () => {
  test('ART-E2E-001 @smoke @REQ-ART-01 @REQ-PLT-03 l’accueil affiche le titre, 9 articles et la pagination', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');

    await expect(page).toHaveTitle(/Nous AI News/);
    await expect(page.getByRole('heading', { level: 1, name: 'Nous AI News' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Dernières actualités' })).toBeVisible();
    await expect(page.getByTestId('article-card')).toHaveCount(SEED.defaultPageSize);

    await expect(page.getByTestId('pagination-status')).toHaveText('Page 1 sur 2');
    await expect(page.getByTestId('pagination-next')).toBeVisible();
    await expect(page.getByTestId('pagination-prev')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('ART-E2E-002 @REQ-ART-01 les articles sont triés du plus récent au plus ancien', async ({ page }) => {
    await page.goto('/');
    const hrefs = await hrefsOf(page.getByTestId('article-card').getByRole('link'));
    expect(hrefs).toEqual(SEED.page1Slugs.map((slug) => `/articles/${slug}`));
  });

  test('ART-E2E-003 @REQ-ART-01 chaque carte présente thématique, titre, résumé, date et durée de lecture', async ({ page }) => {
    await page.goto('/');
    const first = page.getByTestId('article-card').first();
    await expect(first.getByTestId('article-category')).toHaveText('Modèles');
    await expect(first.getByRole('heading', { level: 3 })).toContainText('modèles de raisonnement');
    await expect(first).toContainText('6 octobre 2026');
    await expect(first).toContainText('3 min de lecture');
  });

  test('ART-E2E-004 @REQ-ART-01 navigation de la page 1 à la page 2 puis retour', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('pagination-next').click();

    await expect(page).toHaveURL(/\/\?page=2$/);
    await expect(page.getByTestId('pagination-status')).toHaveText('Page 2 sur 2');
    await expect(page.getByTestId('article-card')).toHaveCount(9);
    expect(await hrefsOf(page.getByTestId('article-card').getByRole('link'))).toEqual(
      SEED.page2Slugs.map((slug) => `/articles/${slug}`),
    );
    await expect(page.getByTestId('pagination-next')).toHaveCount(0);

    await page.getByTestId('pagination-prev').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('pagination-status')).toHaveText('Page 1 sur 2');
  });

  test.describe('pagination invalide ou hors plage : page 404 (valeurs limites)', () => {
    for (const page_ of ['0', '3', 'abc', '-1', '1.5']) {
      test(`ART-E2E-005 @REQ-ART-01 /?page=${page_}`, async ({ page }) => {
        const response = await page.goto(`/?page=${page_}`);
        expect(response?.status()).toBe(404);
        await expect(page.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeVisible();
      });
    }
  });

  test('ART-E2E-006 @REQ-ART-01 page=1 explicite équivaut à la page par défaut', async ({ page }) => {
    await page.goto('/?page=1');
    await expect(page.getByTestId('pagination-status')).toHaveText('Page 1 sur 2');
    await expect(page.getByTestId('article-card')).toHaveCount(9);
  });
});
