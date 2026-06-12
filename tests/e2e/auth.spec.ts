import { test, expect } from '@playwright/test';

test.describe('Auth Pages', () => {
  test('loads login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible();
  });

  test('shows validation error for empty email', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    // Check for HTML5 validation or error message
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('has link to register', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('loads register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1:has-text("Create account")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Create account")')).toBeVisible();
  });

  test('has link to login', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });
});