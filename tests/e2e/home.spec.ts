import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads successfully and shows hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Daily AI|Nous AI News|AI News/i);
    
    // Check for main content - there's a featured article section
    const featuredLink = page.locator('a[href^="/article/"]').first();
    await expect(featuredLink).toBeVisible({ timeout: 10000 });
  });

  test('displays featured articles', async ({ page }) => {
    await page.goto('/');
    const articleLinks = page.locator('a[href^="/article/"]');
    await expect(articleLinks.first()).toBeVisible({ timeout: 10000 });
    await expect(articleLinks.nth(1)).toBeVisible();
  });

  test('navigation works - trending link', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/trending"]');
    await expect(page).toHaveURL(/.*trending/);
    await expect(page.locator('h1:has-text("Trending Now")')).toBeVisible({ timeout: 10000 });
  });

  test('navigation works - search link', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/search"]');
    await expect(page).toHaveURL(/.*search/);
    await expect(page.locator('h1:has-text("Search AI News")')).toBeVisible({ timeout: 10000 });
  });

  test('navigation works - feed link', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/feed"]');
    await expect(page).toHaveURL(/.*feed/);
    await expect(page.locator('h2:has-text("Latest")')).toBeVisible({ timeout: 10000 });
  });
});