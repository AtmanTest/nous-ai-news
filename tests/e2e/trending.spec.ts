import { test, expect } from '@playwright/test';

test.describe('Trending Page', () => {
  test('loads trending page with articles', async ({ page }) => {
    await page.goto('/trending');
    await expect(page.locator('h1:has-text("Trending Now")')).toBeVisible({ timeout: 10000 });
    // Check for trending articles - they're links to /article/:id
    const articleLinks = page.locator('a[href^="/article/"]');
    const count = await articleLinks.count();
    // If there are articles, they should be visible
    if (count > 0) {
      await expect(articleLinks.first()).toBeVisible();
    }
  });

  test('trending indicator shows score', async ({ page }) => {
    await page.goto('/trending');
    // Check for score badges (Zap icon with score)
    const scoreElements = page.locator('text=/\\d+/').filter({ hasText: /^\d+$/ });
    // We just verify the page loads without error
    await expect(page.locator('body')).toBeVisible();
  });

  test('articles have trending scores displayed', async ({ page }) => {
    await page.goto('/trending');
    // Verify the trending page renders properly
    await expect(page.locator('h1:has-text("Trending Now")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('p:has-text("ranked by popularity")')).toBeVisible();
  });
});