import { describe, expect, it, vi } from 'vitest';

async function loadPlaywrightConfig() {
  vi.resetModules();
  const mod = await import('../../../playwright.config');
  return mod.default;
}

describe('Playwright config', () => {
  it('does not start the local web server when E2E_BASE_URL targets a deployed environment', async () => {
    vi.stubEnv('E2E_BASE_URL', 'https://nous-daily.vercel.app');

    const config = await loadPlaywrightConfig();

    expect(config.use?.baseURL).toBe('https://nous-daily.vercel.app');
    expect(config.webServer).toBeUndefined();

    vi.unstubAllEnvs();
  });

  it('starts the local production server for local E2E runs', async () => {
    vi.stubEnv('E2E_BASE_URL', '');

    const config = await loadPlaywrightConfig();

    expect(config.use?.baseURL).toBe('http://localhost:3000');
    expect(config.webServer).toMatchObject({
      command: 'npm run start',
      url: 'http://localhost:3000',
    });

    vi.unstubAllEnvs();
  });
});
