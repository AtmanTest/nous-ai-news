import { expect, test } from '@playwright/test';
import { NEWEST_SLUG, SEED } from '../../support/seed';

test.describe('Plateforme — santé', () => {
  test('PLT-API-001 @smoke @REQ-PLT-01 GET /api/health : 200 « ok » avec version, volume de données et horodatage', async ({
    request,
  }) => {
    const before = Date.now();
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(response.headers()['cache-control']).toContain('no-store');

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(body.articles).toBe(SEED.totalArticles);
    const timestamp = Date.parse(body.timestamp);
    expect(timestamp).not.toBeNaN();
    expect(Math.abs(timestamp - before)).toBeLessThan(60_000);
  });

  test('PLT-API-002 @REQ-PLT-01 l’horodatage avance entre deux appels (réponse non mise en cache)', async ({ request }) => {
    const first = (await (await request.get('/api/health')).json()).timestamp;
    await new Promise((resolve) => setTimeout(resolve, 15));
    const second = (await (await request.get('/api/health')).json()).timestamp;
    expect(Date.parse(second)).toBeGreaterThan(Date.parse(first));
  });

  test('PLT-API-003 @REQ-PLT-03 route API inconnue : 404', async ({ request }) => {
    expect((await request.get('/api/inexistant')).status()).toBe(404);
  });
});

test.describe('Plateforme — flux RSS', () => {
  test('PLT-API-010 @smoke @REQ-PLT-02 GET /feed.xml : 200, type RSS, XML bien formé de base', async ({ request }) => {
    const response = await request.get('/feed.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/rss+xml');

    const xml = await response.text();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain('<language>fr-FR</language>');
    expect(xml.trim().endsWith('</rss>')).toBe(true);
  });

  test('PLT-API-011 @REQ-PLT-02 un <item> par article, le plus récent en premier', async ({ request }) => {
    const xml = await (await request.get('/feed.xml')).text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    expect(items).toHaveLength(SEED.totalArticles);
    expect(items[0]).toContain(`/articles/${NEWEST_SLUG}</link>`);
  });

  test('PLT-API-012 @REQ-PLT-02 les dates de publication sont valides (RFC 822) et décroissantes', async ({ request }) => {
    const xml = await (await request.get('/feed.xml')).text();
    const dates = [...xml.matchAll(/<pubDate>(.*?)<\/pubDate>/g)].map((m) => Date.parse(m[1] as string));
    expect(dates).toHaveLength(SEED.totalArticles);
    expect(dates.every((d) => !Number.isNaN(d))).toBe(true);
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  test('PLT-API-013 @REQ-PLT-02 caractères réservés correctement échappés (pas de « & » ou « < » nus)', async ({
    request,
  }) => {
    const xml = await (await request.get('/feed.xml')).text();
    expect(xml).toContain('L&apos;interprétabilité');
    expect(xml).not.toMatch(/&(?!(amp|lt|gt|quot|apos);)/);
    const textNodes = [...xml.matchAll(/<(?:title|description|category)>(.*?)<\/(?:title|description|category)>/g)];
    expect(textNodes.every((m) => !(m[1] as string).includes('<'))).toBe(true);
  });

  test('PLT-API-014 @REQ-PLT-02 les liens des articles sont absolus et pointent vers le site', async ({ request, baseURL }) => {
    const xml = await (await request.get('/feed.xml')).text();
    const links = [...xml.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>/g)].map((m) => m[1] as string);
    expect(links).toHaveLength(SEED.totalArticles);
    expect(links.every((link) => link.startsWith(`${baseURL}/articles/`))).toBe(true);
  });
});

test.describe('Plateforme — en-têtes de sécurité', () => {
  for (const path of ['/', '/api/health', '/feed.xml', '/api/articles']) {
    test(`PLT-API-020 @smoke @REQ-PLT-06 ${path} : en-têtes de sécurité de base présents`, async ({ request }) => {
      const headers = (await request.get(path)).headers();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['permissions-policy']).toContain('camera=()');
    });
  }

  test('PLT-API-021 @REQ-PLT-06 la pile technique n’est pas divulguée (pas de X-Powered-By)', async ({ request }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('PLT-API-022 @REQ-PLT-06 aucune erreur serveur ne fuite de trace d’exécution (404 HTML)', async ({ request }) => {
    const text = await (await request.get('/page-qui-nexiste-pas')).text();
    expect(text).not.toMatch(/at\s+\S+\s+\(.*:\d+:\d+\)/); // pile d'appels
    expect(text).not.toContain('node_modules');
  });
});
