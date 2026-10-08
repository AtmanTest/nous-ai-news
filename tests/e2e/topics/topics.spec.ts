import { expect, test } from '@playwright/test';
import { SEED } from '../../support/seed';

test.describe('Thématiques', () => {
  test('TOP-E2E-001 @smoke @REQ-TOP-01 la page liste les 6 thématiques avec leur nombre d’articles', async ({ page }) => {
    await page.goto('/topics');

    await expect(page).toHaveTitle(/Thématiques/);
    await expect(page.getByRole('heading', { level: 1, name: 'Thématiques' })).toBeVisible();
    await expect(page.getByTestId('topic-card')).toHaveCount(SEED.categories.length);
    await expect(page.getByTestId('topic-count')).toHaveText(Array(SEED.categories.length).fill('3 articles'));
    await expect(page.getByTestId('topic-card').locator('h2')).toHaveText(
      SEED.categories.map((slug) => SEED.categoryLabels[slug] as string),
    );
  });

  for (const slug of SEED.categories) {
    test(`TOP-E2E-002 @REQ-TOP-02 la page « ${slug} » n’affiche que des articles de cette thématique`, async ({ page }) => {
      await page.goto('/topics');
      await page.locator(`[data-topic="${slug}"]`).getByRole('link').click();

      await expect(page).toHaveURL(new RegExp(`/topics/${slug}$`));
      await expect(page.getByRole('heading', { level: 1, name: SEED.categoryLabels[slug] })).toBeVisible();
      await expect(page.getByTestId('article-card')).toHaveCount(SEED.perCategory);
      await expect(page.getByTestId('article-category')).toHaveText(Array(SEED.perCategory).fill(SEED.categoryLabels[slug]));
    });
  }

  test('TOP-E2E-003 @REQ-TOP-02 les articles d’une thématique sont triés du plus récent au plus ancien', async ({ page }) => {
    await page.goto('/topics/agents');
    const times = await page.getByTestId('article-card').locator('time').evaluateAll((els) => els.map((el) => el.getAttribute('datetime') ?? ''));
    expect(times).toHaveLength(3);
    expect(times).toEqual([...times].sort().reverse());
  });

  test('TOP-E2E-004 @REQ-TOP-02 une thématique inconnue affiche la page 404 (statut HTTP 404)', async ({ page }) => {
    const response = await page.goto('/topics/inconnue');
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('not-found')).toBeVisible();
  });

  test('TOP-E2E-005 @REQ-TOP-01 les compteurs de la page correspondent à ceux de l’API (cohérence UI ↔ API)', async ({ page, request }) => {
    const { data } = await (await request.get('/api/topics')).json();
    await page.goto('/topics');
    for (const topic of data as Array<{ slug: string; count: number }>) {
      await expect(page.locator(`[data-topic="${topic.slug}"]`).getByTestId('topic-count')).toHaveText(`${topic.count} articles`);
    }
  });
});
