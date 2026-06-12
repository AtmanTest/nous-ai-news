import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test('loads search page with search input', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('h1:has-text("Search AI News")')).toBeVisible({ timeout: 10000 });
    // The search input has placeholder "Search articles, topics, keywords..."
    await expect(page.locator('input[placeholder="Search articles, topics, keywords..."]')).toBeVisible();
  });

  test('can search for articles', async ({ page }) => {
    await page.goto('/search');
    await page.fill('input[placeholder="Search articles, topics, keywords..."]', 'AI');
    await page.click('button:has-text("Search")');
    // Wait for results or no results state
    await page.waitForLoadState('networkidle');
  });

  test('shows category filters', async ({ page }) => {
    await page.goto('/search');
    // The search page shows category links at the bottom when no query
    await expect(page.locator('a[href*="/search?category="]').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows keyword filter panel', async ({ page }) => {
    await page.goto('/search');
    // Keywords section
    await expect(page.locator('text=Keywords').first()).toBeVisible({ timeout: 10000 });
  });
});