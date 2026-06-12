import { test, expect } from '@playwright/test';

test.describe('Feed Tabs (Latest, Trending, For You)', () => {
  test('shows feed tabs', async ({ page }) => {
    await page.goto('/feed');
    await expect(page.locator('button:has-text("Latest")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Trending")')).toBeVisible();
    await expect(page.locator('button:has-text("For You")')).toBeVisible();
  });

  test('can switch to latest tab via URL', async ({ page }) => {
    await page.goto('/feed?tab=trending');
    await expect(page.locator('h2:has-text("Trending")')).toBeVisible({ timeout: 10000 });
    await page.goto('/feed');
    await expect(page.locator('h2:has-text("Latest")')).toBeVisible({ timeout: 10000 });
  });

  test('can switch to trending tab via URL', async ({ page }) => {
    await page.goto('/feed');
    await expect(page.locator('h2:has-text("Latest")')).toBeVisible({ timeout: 10000 });
    await page.goto('/feed?tab=trending');
    await expect(page.locator('h2:has-text("Trending")')).toBeVisible({ timeout: 10000 });
  });

  test('trending page loads directly', async ({ page }) => {
    await page.goto('/trending');
    await expect(page.locator('h1:has-text("Trending Now")')).toBeVisible({ timeout: 10000 });
    const articleLinks = page.locator('a[href^="/article/"]');
    if (await articleLinks.count() > 0) {
      await expect(articleLinks.first()).toBeVisible();
    }
  });
});