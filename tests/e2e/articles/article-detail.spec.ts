import { expect, test } from '@playwright/test';
import { hrefsOf, PAGE_TITLE_SUFFIX } from '../../support/e2e';
import { KNOWN_ARTICLE } from '../../support/seed';

test.describe('Articles — page de détail', () => {
  test('ART-E2E-010 @smoke @REQ-ART-04 ouvrir un article depuis l’accueil affiche son contenu complet', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.getByTestId('article-card').first();
    const title = (await firstCard.getByRole('heading').innerText()).trim();
    await firstCard.getByRole('link').click();

    await expect(page).toHaveURL(/\/articles\/modeles-raisonnement-longue-duree$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByTestId('article-body').locator('p')).toHaveCount(2);
    await expect(page.getByTestId('article-header').getByTestId('article-category')).toHaveText('Modèles');
    await expect(page.getByTestId('bookmark-button')).toBeVisible();
  });

  test('ART-E2E-011 @REQ-ART-04 métadonnées : source, date longue, durée de lecture, tags, titre de page', async ({ page }) => {
    await page.goto(`/articles/${KNOWN_ARTICLE.slug}`);

    await expect(page).toHaveTitle(`${KNOWN_ARTICLE.title}${PAGE_TITLE_SUFFIX}`);
    await expect(page.getByTestId('article-meta')).toContainText('Rédaction Nous');
    await expect(page.getByTestId('article-meta')).toContainText('25 septembre 2026');
    await expect(page.getByTestId('article-meta')).toContainText('4 min de lecture');
    await expect(page.getByTestId('article-tags').getByRole('listitem')).toHaveText(['codage', 'revue de code', 'qualité']);
  });

  test('ART-E2E-012 @REQ-ART-04 « À lire aussi » propose les autres articles de la thématique, jamais l’article courant', async ({
    page,
  }) => {
    await page.goto(`/articles/${KNOWN_ARTICLE.slug}`);
    const related = page.getByTestId('related-articles');

    await expect(related.getByRole('heading', { level: 2, name: 'À lire aussi' })).toBeVisible();
    expect(await hrefsOf(related.getByRole('link'))).toEqual(KNOWN_ARTICLE.relatedSlugs.map((slug) => `/articles/${slug}`));
    await expect(related.getByTestId('article-category')).toHaveText([KNOWN_ARTICLE.categoryLabel, KNOWN_ARTICLE.categoryLabel]);
  });

  test('ART-E2E-013 @REQ-ART-04 un article lié est consultable en un clic', async ({ page }) => {
    await page.goto(`/articles/${KNOWN_ARTICLE.slug}`);
    const target = page.getByTestId('related-articles').getByRole('link').first();
    const targetTitle = (await target.innerText()).trim();
    await target.click();

    await expect(page).toHaveURL(new RegExp(`/articles/${KNOWN_ARTICLE.relatedSlugs[0]}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(targetTitle);
  });

  test('ART-E2E-014 @REQ-ART-03 un slug inconnu affiche la page 404 avec le statut HTTP 404', async ({ page }) => {
    const response = await page.goto('/articles/article-qui-nexiste-pas');
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('not-found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
  });

  test('ART-E2E-015 @REQ-ART-04 le lien de thématique mène à la page de la thématique', async ({ page }) => {
    await page.goto(`/articles/${KNOWN_ARTICLE.slug}`);
    await page.getByTestId('article-header').getByTestId('article-category').click();
    await expect(page).toHaveURL(new RegExp(`/topics/${KNOWN_ARTICLE.category}$`));
    await expect(page.getByRole('heading', { level: 1, name: KNOWN_ARTICLE.categoryLabel })).toBeVisible();
  });

  test('ART-E2E-016 @REQ-ART-04 le contenu texte ne peut pas injecter de HTML (échappement)', async ({ page }) => {
    await page.goto(`/articles/${KNOWN_ARTICLE.slug}`);
    // Aucun élément <script> ou <iframe> dans la zone de contenu rendue.
    await expect(page.getByTestId('article-body').locator('script, iframe, img')).toHaveCount(0);
  });
});
