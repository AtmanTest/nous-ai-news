import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3100';
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

/**
 * Trois projets, un par niveau de test d'intégration/système :
 *  - api         : contrat HTTP des routes /api (aucun navigateur)
 *  - e2e-desktop : parcours utilisateur complets (Chromium desktop)
 *  - e2e-mobile  : smoke + responsive (Pixel 7) — uniquement @smoke et @mobile
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
    },
    {
      name: 'e2e-desktop',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-mobile',
      testDir: './tests/e2e',
      grep: /@mobile|@smoke/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- -p ${PORT}`,
        url: `${baseURL}/api/health`,
        timeout: 240_000,
        reuseExistingServer: !isCI,
      },
});
