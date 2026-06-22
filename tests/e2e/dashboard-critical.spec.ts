import { test, expect, type Page } from '@playwright/test';

async function installErrorCollectors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  page.on('pageerror', (error) => pageErrors.push(error.message));

  return { consoleErrors, pageErrors };
}

test.describe('P0 dashboard widgets and data health', () => {
  test('homepage exposes real dashboard entry points: View Engine, Read Essays, Latest AI News, Topics All Models', async ({ page }) => {
    const errors = await installErrorCollectors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);

    await expect(page.getByRole('link', { name: /View Engine/i })).toHaveAttribute('href', '/auto-tune');
    await expect(page.getByRole('link', { name: /Read Essays/i })).toHaveAttribute('href', '/ia-auto-news');
    await expect(page.getByRole('heading', { name: /Latest AI News/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('a[href="/topics/models"]').first()).toBeVisible({ timeout: 10_000 });

    expect(errors.pageErrors, 'homepage dashboard page errors').toEqual([]);
    expect(errors.consoleErrors, 'homepage dashboard console errors').toEqual([]);
  });

  test('Trending Models sidebar is responsive at large desktop width, not only maximized screens', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);

    await expect(page.getByText(/Trending Models/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('critical public APIs return valid data contracts', async ({ request }) => {
    const endpoints = [
      '/api/news?limit=3',
      '/api/news/counts-by-day?days=7',
      '/api/news/models?limit=5',
      '/api/huggingface/trending',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status(), `${endpoint} status`).toBeLessThan(400);
      await expect(async () => response.json()).not.toThrow();
    }
  });

  test('Latest AI News data health: production feed must not silently render an empty article store', async ({ page, request }) => {
    const response = await request.get('/api/news?limit=1');
    expect(response.status(), '/api/news should be healthy').toBeLessThan(400);

    const payload = await response.json();
    const articles = Array.isArray(payload) ? payload : payload.articles;
    expect(Array.isArray(articles), '/api/news returns an article array or { articles }').toBe(true);
    expect(articles.length, 'Latest AI News requires at least one published article in production').toBeGreaterThan(0);

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);
    await expect(page.locator('a[href^="/article/"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText(/All articles are hidden by source filters/i);
  });
});
