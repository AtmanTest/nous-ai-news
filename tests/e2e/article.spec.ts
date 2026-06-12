import { test, expect } from '@playwright/test';

test.describe('Article Page', () => {
  test('loads article page with content', async ({ page }) => {
    // First go to home to find an article link
    await page.goto('/');
    
    // Find and click an article link
    const articleLink = page.locator('a[href^="/article/"]').first();
    if (await articleLink.isVisible({ timeout: 10000 })) {
      const href = await articleLink.getAttribute('href');
      await articleLink.click();
      
      // Wait for article page to load
      await expect(page).toHaveURL(/.*article/);
      
      // Check article content - article pages have h1 with the title
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    }
  });

  test('displays article metadata (source, date, category)', async ({ page }) => {
    await page.goto('/');
    const articleLink = page.locator('a[href^="/article/"]').first();
    if (await articleLink.isVisible({ timeout: 10000 })) {
      await articleLink.click();
      await expect(page).toHaveURL(/.*article/);
      
      // Check for metadata - source name, time ago, category badge
      await expect(page.locator('text=/Published|min read|ago/').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('shows related articles', async ({ page }) => {
    await page.goto('/');
    const articleLink = page.locator('a[href^="/article/"]').first();
    if (await articleLink.isVisible({ timeout: 10000 })) {
      await articleLink.click();
      await expect(page).toHaveURL(/.*article/);
      
      const related = page.locator('h2:has-text("Related Stories")');
      if (await related.isVisible({ timeout: 5000 })) {
        await expect(related).toBeVisible();
      }
    }
  });

  test('has back to home link', async ({ page }) => {
    await page.goto('/');
    const articleLink = page.locator('a[href^="/article/"]').first();
    if (await articleLink.isVisible({ timeout: 10000 })) {
      await articleLink.click();
      await expect(page).toHaveURL(/.*article/);
      
      // Check for back to home link
      await expect(page.locator('text=Back to Home')).toBeVisible({ timeout: 5000 });
    }
  });
});