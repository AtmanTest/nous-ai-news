import { expect, test } from '@playwright/test';
import { BOOKMARKS_STORAGE_KEY, bookmarkArticle, openArticle, trackErrors } from '../../support/e2e';
import { KNOWN_ARTICLE } from '../../support/seed';

const SECOND = KNOWN_ARTICLE.relatedSlugs[0];

test.describe('Favoris — ajout, persistance, retrait', () => {
  test('BKM-E2E-001 @smoke @REQ-BKM-01 ajouter un favori puis recharger : l’état est conservé', async ({ page }) => {
    await openArticle(page, KNOWN_ARTICLE.slug);
    const button = page.getByTestId('bookmark-button');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveText('Ajouter aux favoris');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveText('Retirer des favoris');

    await page.reload();
    await expect(page.getByTestId('bookmark-button')).toHaveAttribute('data-hydrated', 'true');
    await expect(page.getByTestId('bookmark-button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('BKM-E2E-002 @REQ-BKM-01 transitions d’état : ajout → retrait → ajout → retrait', async ({ page }) => {
    await openArticle(page, KNOWN_ARTICLE.slug);
    const button = page.getByTestId('bookmark-button');

    for (const expected of ['true', 'false', 'true', 'false']) {
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', expected);
    }
  });

  test('BKM-E2E-003 @REQ-BKM-02 état vide initial avec lien vers les actualités', async ({ page }) => {
    await page.goto('/bookmarks');
    await expect(page.getByRole('heading', { level: 1, name: 'Mes favoris' })).toBeVisible();
    await expect(page.getByTestId('bookmarks-empty')).toContainText('aucun favori');
    await expect(page.getByTestId('bookmarks-empty').getByRole('link')).toHaveAttribute('href', '/');
  });

  test('BKM-E2E-004 @REQ-BKM-02 la page Favoris liste les articles ajoutés, le plus récent ajout d’abord', async ({ page }) => {
    await bookmarkArticle(page, KNOWN_ARTICLE.slug);
    await bookmarkArticle(page, SECOND);

    await page.goto('/bookmarks');
    await expect(page.getByTestId('bookmarks-count')).toHaveText('2 favoris');
    const items = page.getByTestId('bookmark-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).getByRole('link')).toHaveAttribute('href', `/articles/${SECOND}`);
    await expect(items.nth(1).getByRole('link')).toHaveAttribute('href', `/articles/${KNOWN_ARTICLE.slug}`);
  });

  test('BKM-E2E-005 @REQ-BKM-01 retirer depuis la page Favoris met à jour la liste, le compteur et l’article', async ({ page }) => {
    await bookmarkArticle(page, KNOWN_ARTICLE.slug);
    await bookmarkArticle(page, SECOND);

    await page.goto('/bookmarks');
    await page.getByTestId('bookmark-item').first().getByTestId('bookmark-remove').click();
    await expect(page.getByTestId('bookmark-item')).toHaveCount(1);
    await expect(page.getByTestId('bookmarks-count')).toHaveText('1 favori');

    await page.getByTestId('bookmark-remove').click();
    await expect(page.getByTestId('bookmarks-empty')).toBeVisible();

    await openArticle(page, KNOWN_ARTICLE.slug);
    await expect(page.getByTestId('bookmark-button')).toHaveAttribute('aria-pressed', 'false');
  });

  test('BKM-E2E-006 @REQ-BKM-01 le bouton « Retirer » possède un nom accessible qui identifie l’article', async ({ page }) => {
    await bookmarkArticle(page, KNOWN_ARTICLE.slug);
    await page.goto('/bookmarks');
    await expect(page.getByRole('button', { name: new RegExp(`Retirer.*${KNOWN_ARTICLE.title}`) })).toBeVisible();
  });

  test('BKM-E2E-007 @REQ-BKM-01 synchronisation entre onglets : un ajout apparaît sans rechargement', async ({ context }) => {
    const bookmarksTab = await context.newPage();
    await bookmarksTab.goto('/bookmarks');
    await expect(bookmarksTab.getByTestId('bookmarks-empty')).toBeVisible();

    const articleTab = await context.newPage();
    await bookmarkArticle(articleTab, KNOWN_ARTICLE.slug);

    await expect(bookmarksTab.getByTestId('bookmark-item')).toHaveCount(1);
  });
});

test.describe('Favoris — résilience du stockage (devinette d’erreurs)', () => {
  test('BKM-E2E-010 @REQ-BKM-03 JSON corrompu dans le localStorage : état vide, aucune erreur, le bouton reste utilisable', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.addInitScript(
      ([key]) => window.localStorage.setItem(key as string, '{corrompu'),
      [BOOKMARKS_STORAGE_KEY],
    );

    await page.goto('/bookmarks');
    await expect(page.getByTestId('bookmarks-empty')).toBeVisible();

    await openArticle(page, KNOWN_ARTICLE.slug);
    await page.getByTestId('bookmark-button').click();
    await expect(page.getByTestId('bookmark-button')).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });

  test('BKM-E2E-011 @REQ-BKM-03 slugs inconnus et valeurs non conformes ignorés à l’affichage', async ({ page }) => {
    await page.addInitScript(
      ([key, known]) =>
        window.localStorage.setItem(key as string, JSON.stringify(['article-supprime', 42, null, known, known])),
      [BOOKMARKS_STORAGE_KEY, KNOWN_ARTICLE.slug],
    );

    await page.goto('/bookmarks');
    await expect(page.getByTestId('bookmark-item')).toHaveCount(1);
    await expect(page.getByTestId('bookmarks-count')).toHaveText('1 favori');
  });

  test('BKM-E2E-012 @REQ-BKM-03 localStorage inaccessible (SecurityError) : le site reste utilisable sans planter', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('denied', 'SecurityError');
        },
      });
    });

    await page.goto('/bookmarks');
    await expect(page.getByTestId('bookmarks-empty')).toBeVisible();

    await openArticle(page, KNOWN_ARTICLE.slug);
    await page.getByTestId('bookmark-button').click(); // dégradation silencieuse : pas d'exception
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(KNOWN_ARTICLE.title);
    expect(errors).toEqual([]);
  });

  test('BKM-E2E-013 @REQ-BKM-01 les favoris sont isolés par navigateur (nouveau contexte = liste vide)', async ({ page, browser }) => {
    await bookmarkArticle(page, KNOWN_ARTICLE.slug);

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await otherPage.goto('/bookmarks');
    await expect(otherPage.getByTestId('bookmarks-empty')).toBeVisible();
    await otherContext.close();
  });
});
