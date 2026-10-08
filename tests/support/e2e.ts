import { expect, type Locator, type Page } from '@playwright/test';

/** Collecte les erreurs JS non interceptées et les erreurs console pendant toute la durée du test. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'défilement horizontal détecté').toBeLessThanOrEqual(0);
}

/** Ouvre un article et attend l'hydratation du composant client (évite les clics avant React). */
export async function openArticle(page: Page, slug: string): Promise<void> {
  await page.goto(`/articles/${slug}`);
  await expect(page.getByTestId('bookmark-button')).toHaveAttribute('data-hydrated', 'true');
}

export async function bookmarkArticle(page: Page, slug: string): Promise<void> {
  await openArticle(page, slug);
  const button = page.getByTestId('bookmark-button');
  if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

export function hrefsOf(locator: Locator): Promise<Array<string | null>> {
  return locator.evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
}

export const BOOKMARKS_STORAGE_KEY = 'nous:bookmarks:v1';

export const PAGE_TITLE_SUFFIX = ' · Nous AI News';
