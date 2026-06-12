import { test, expect } from '@playwright/test';

test.describe('Bookmarks Page', () => {
  test('loads bookmarks page', async ({ page }) => {
    await page.goto('/bookmarks');
    await expect(page.locator('h1:has-text("Bookmarks")')).toBeVisible({ timeout: 10000 });
  });

  test('shows empty state when no bookmarks', async ({ page }) => {
    await page.goto('/bookmarks');
    await expect(page.locator('text=No bookmarks yet')).toBeVisible({ timeout: 10000 });
    // Check for the bookmark icon and the empty state message
    await expect(page.locator('text=Save articles you want to read later')).toBeVisible();
  });

  test('can navigate to trending from empty state', async ({ page }) => {
    await page.goto('/bookmarks');
    await page.click('a[href="/trending"]');
    await expect(page).toHaveURL(/.*trending/);
  });
});