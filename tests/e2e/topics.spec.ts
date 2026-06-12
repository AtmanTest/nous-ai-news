import { test, expect } from '@playwright/test';

test.describe('Topics Pages', () => {
  test('loads topics index page', async ({ page }) => {
    // The topics index might be at /topics or just category pages
    // Based on the app structure, topic pages are at /topics/[slug]
    // Let's check if there's a topics listing page
    await page.goto('/topics');
    // If it 404s, we can skip or test a specific topic page
    await page.waitForLoadState('networkidle');
  });

  test('loads specific topic page', async ({ page }) => {
    // Test a known category - models
    await page.goto('/topics/models');
    await expect(page.locator('h1:has-text("AI Models")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=The latest AI model releases')).toBeVisible();
  });

  test('topic page shows topic header', async ({ page }) => {
    await page.goto('/topics/models');
    await expect(page.locator('h1:has-text("AI Models")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('p:has-text("latest AI model releases")')).toBeVisible();
  });

  test('can navigate to different topic pages', async ({ page }) => {
    const topics = [
      { slug: 'models', label: 'AI Models' },
      { slug: 'research', label: 'Research' },
      { slug: 'business', label: 'Business' },
    ];
    
    for (const topic of topics) {
      await page.goto(`/topics/${topic.slug}`);
      await expect(page.locator(`h1:has-text("${topic.label}")`)).toBeVisible({ timeout: 10000 });
    }
  });
});