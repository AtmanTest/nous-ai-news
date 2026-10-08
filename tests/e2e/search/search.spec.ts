import { expect, test, type Page } from '@playwright/test';

const searchFromHeader = async (page: Page, query: string) => {
  await page.getByRole('searchbox', { name: 'Rechercher un article' }).fill(query);
  await page.keyboard.press('Enter');
};

test.describe('Recherche — parcours utilisateur', () => {
  test('SRC-E2E-001 @smoke @REQ-SRC-01 rechercher depuis l’en-tête (touche Entrée) affiche les résultats', async ({ page }) => {
    await page.goto('/');
    await searchFromHeader(page, 'interpretabilite');

    await expect(page).toHaveURL(/\/search\?q=interpretabilite$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Recherche' })).toBeVisible();
    await expect(page.getByTestId('search-count')).toHaveText('1 résultat pour « interpretabilite »');
    await expect(page.getByTestId('article-card')).toHaveCount(1);
    await expect(page.getByTestId('article-card')).toContainText('interprétabilité mécaniste');
  });

  test('SRC-E2E-002 @REQ-SRC-01 le bouton « Rechercher » déclenche la recherche comme la touche Entrée', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Rechercher un article' }).fill('quantification');
    await page.getByRole('button', { name: 'Rechercher' }).click();

    await expect(page).toHaveURL(/\/search\?q=quantification$/);
    await expect(page.getByTestId('article-card')).toHaveCount(1);
  });

  test('SRC-E2E-003 @REQ-SRC-01 insensibilité aux accents : « modèles » et « modeles » donnent les mêmes résultats', async ({
    page,
  }) => {
    await page.goto('/search?q=modèles');
    const accented = await page.getByTestId('article-card').count();
    expect(accented).toBeGreaterThan(0);

    await page.goto('/search?q=modeles');
    await expect(page.getByTestId('article-card')).toHaveCount(accented);
  });

  test('SRC-E2E-004 @REQ-SRC-01 sémantique ET : plusieurs mots restreignent les résultats', async ({ page }) => {
    await page.goto('/search?q=agents');
    const broad = await page.getByTestId('article-card').count();

    await page.goto('/search?q=agents%20codage');
    await expect(page.getByTestId('article-card')).toHaveCount(1);
    expect(broad).toBeGreaterThan(1);
  });

  test('SRC-E2E-005 @REQ-SRC-01 aucun résultat : message explicite avec rappel de la requête', async ({ page }) => {
    await page.goto('/search?q=zzzzqqqq');
    await expect(page.getByTestId('search-empty')).toContainText('Aucun résultat pour « zzzzqqqq »');
    await expect(page.getByTestId('article-card')).toHaveCount(0);
  });

  test('SRC-E2E-006 @REQ-SRC-02 requête trop courte : message d’erreur accessible (role=alert)', async ({ page }) => {
    await page.goto('/');
    await searchFromHeader(page, 'a');

    const alert = page.getByRole('alert').filter({ hasText: 'au moins 2 caractères' });
    await expect(alert).toBeVisible();
    await expect(page.getByTestId('search-error')).toBeVisible();
    await expect(page.getByTestId('article-card')).toHaveCount(0);
  });

  test('SRC-E2E-007 @REQ-SRC-02 recherche vide ou espaces : erreur de validation, pas de crash', async ({ page }) => {
    await page.goto('/search?q=');
    await expect(page.getByTestId('search-error')).toBeVisible();
    await page.goto('/search?q=%20%20%20');
    await expect(page.getByTestId('search-error')).toBeVisible();
  });

  test('SRC-E2E-008 @REQ-SRC-02 /search sans paramètre : invitation à saisir une recherche', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByTestId('search-prompt')).toContainText('au moins 2 caractères');
  });

  test('SRC-E2E-009 @REQ-SRC-01 cliquer un résultat ouvre l’article correspondant', async ({ page }) => {
    await page.goto('/search?q=quantification');
    await page.getByTestId('article-card').getByRole('link').click();
    await expect(page).toHaveURL(/\/articles\/inference-locale-materiel-grand-public$/);
  });

  test('SRC-E2E-010 @REQ-SRC-02 XSS : la requête est affichée comme du texte, jamais interprétée comme du HTML', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      void dialog.dismiss();
    });

    await page.goto(`/search?q=${encodeURIComponent('<img src=x onerror=alert(1)>')}`);
    const empty = page.getByTestId('search-empty');
    await expect(empty).toContainText('<img src=x onerror=alert(1)>');
    await expect(empty.locator('img')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });

  test('SRC-E2E-011 @REQ-SRC-02 script injecté dans l’URL : aucune exécution', async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent('<script>window.__xss = 1</script>')}`);
    await expect(page.getByTestId('search-empty')).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test('SRC-E2E-012 @REQ-SRC-01 la recherche est accessible au clavier (focus → saisie → Entrée)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Rechercher un article' }).focus();
    await expect(page.getByRole('searchbox', { name: 'Rechercher un article' })).toBeFocused();
    await page.keyboard.type('codage');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('article-card')).toHaveCount(1);
  });
});
