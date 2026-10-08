import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { KNOWN_ARTICLE } from '../../support/seed';

const PAGES = [
  ['accueil', '/'],
  ['accueil page 2', '/?page=2'],
  ['article', `/articles/${KNOWN_ARTICLE.slug}`],
  ['recherche (résultats)', '/search?q=agents'],
  ['recherche (aucun résultat)', '/search?q=zzzzqqqq'],
  ['recherche (erreur)', '/search?q=a'],
  ['thématiques', '/topics'],
  ['thématique', '/topics/agents'],
  ['favoris', '/bookmarks'],
  ['newsletter', '/newsletter'],
  ['page 404', '/page-introuvable'],
] as const;

/**
 * [REQ-PLT-04] Accessibilité : WCAG 2.1 A/AA via axe-core.
 * Seuil : aucune violation « serious » ou « critical ». Les violations « moderate/minor » sont
 * tracées dans les annotations du rapport sans faire échouer le test (suivi en backlog).
 */
test.describe('Plateforme — accessibilité (axe-core, WCAG 2.1 A/AA)', () => {
  for (const [name, path] of PAGES) {
    test(`PLT-E2E-020 @REQ-PLT-04 ${name} (${path})`, async ({ page }, testInfo) => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      for (const violation of results.violations.filter((v) => !blocking.includes(v))) {
        testInfo.annotations.push({ type: 'a11y-backlog', description: `${violation.id} (${violation.impact}) — ${violation.help}` });
      }

      expect(
        blocking.map((v) => `${v.id} [${v.impact}] ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
      ).toEqual([]);
    });
  }

  test('PLT-E2E-021 @REQ-PLT-04 l’indicateur de focus est visible sur les éléments interactifs', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab'); // lien d'évitement
    await page.keyboard.press('Tab'); // logo
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as Element);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
    expect(outline.style).not.toBe('none');
    expect(parseFloat(outline.width)).toBeGreaterThan(0);
  });

  test('PLT-E2E-022 @REQ-PLT-04 les champs de formulaire ont un nom accessible', async ({ page }) => {
    await page.goto('/newsletter');
    await expect(page.getByRole('textbox', { name: 'Adresse e-mail' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /accepte de recevoir/ })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Rechercher un article' })).toBeVisible();
  });
});
