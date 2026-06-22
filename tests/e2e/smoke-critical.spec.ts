import { test, expect, type Page } from '@playwright/test';

const criticalRoutes = [
  { path: '/', marker: /Daily AI|Latest AI News|Auto Evolve/i },
  { path: '/feed', marker: /Latest|Trending|For You/i },
  { path: '/daily', marker: /Daily|Today|AI News/i },
  { path: '/trending', marker: /Trending/i },
  { path: '/search', marker: /Search AI News/i },
  { path: '/bookmarks', marker: /Bookmarks|Sign in|saved/i },
  { path: '/settings', marker: /Settings|Preferences/i },
  { path: '/auto-tune', marker: /Auto Evolve|Self-Improving|Engine/i },
  { path: '/ia-auto-news', marker: /DeepMind|IA Auto News|essais/i },
  { path: '/topics/models', marker: /Models|AI News|articles/i },
  { path: '/topics/research', marker: /Research|AI News|articles/i },
  { path: '/topics/business', marker: /Business|AI News|articles/i },
  { path: '/topics/policy', marker: /Policy|AI News|articles/i },
];

async function installErrorCollectors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  return { consoleErrors, pageErrors };
}

test.describe('P0 production smoke coverage', () => {
  for (const route of criticalRoutes) {
    test(`${route.path} renders without HTTP, app, or console errors`, async ({ page }) => {
      const errors = await installErrorCollectors(page);
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);

      expect(response?.status(), `${route.path} HTTP status`).toBeLessThan(400);
      await expect(page.locator('body')).not.toContainText(/Something went wrong|Internal server error/i);
      await expect(page.locator('body')).not.toContainText(/Error 500/i);
      await expect(page.locator('body')).toContainText(route.marker, { timeout: 10_000 });
      expect(errors.pageErrors, `${route.path} page errors`).toEqual([]);
      expect(errors.consoleErrors, `${route.path} console errors`).toEqual([]);
    });
  }

  test('all primary navigation links point to real internal routes', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);

    const hrefs = await page.locator('a[href^="/"]').evaluateAll((anchors) =>
      Array.from(new Set(
        anchors
          .map((anchor) => anchor.getAttribute('href'))
          .filter((href): href is string => Boolean(href))
          .filter((href) => !href.startsWith('/article/'))
          .filter((href) => !href.startsWith('/_next/'))
      ))
    );

    expect(hrefs.length, 'expected internal navigation links on homepage').toBeGreaterThan(0);

    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), `${href} should not be 404/500`).toBeLessThan(400);
    }
  });

  test('article journey from homepage opens a real article detail page', async ({ page }) => {
    const errors = await installErrorCollectors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);

    let articleLink = page.locator('a[href^="/article/"]').first();
    if ((await articleLink.count()) === 0) {
      await page.goto('/feed', { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);
      articleLink = page.locator('a[href^="/article/"]').first();
    }

    test.skip((await articleLink.count()) === 0, 'No article link available in this environment');
    await expect(articleLink, 'site must expose at least one real article link when articles exist').toBeVisible({ timeout: 10_000 });

    await articleLink.click();
    await expect(page).toHaveURL(/\/article\//);
    await expect(page.locator('main')).not.toContainText(/^500$/);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
    expect(errors.pageErrors, 'article journey page errors').toEqual([]);
    expect(errors.consoleErrors, 'article journey console errors').toEqual([]);
  });
});
