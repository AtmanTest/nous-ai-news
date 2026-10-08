import { expect, test } from '@playwright/test';
import { expectApiError } from '../../support/api';
import { KNOWN_ARTICLE, SEED } from '../../support/seed';

test.describe('Articles — GET /api/articles/[slug]', () => {
  test('ART-API-101 @smoke @REQ-ART-03 article connu : 200 avec le corps complet', async ({ request }) => {
    const response = await request.get(`/api/articles/${KNOWN_ARTICLE.slug}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const { data } = await response.json();
    expect(data).toMatchObject({
      slug: KNOWN_ARTICLE.slug,
      title: KNOWN_ARTICLE.title,
      category: KNOWN_ARTICLE.category,
    });
    expect(Array.isArray(data.body)).toBe(true);
    expect(data.body.length).toBeGreaterThanOrEqual(2);
    expect(data.body.every((p: unknown) => typeof p === 'string' && p.length > 0)).toBe(true);
  });

  test('ART-API-102 @REQ-ART-03 cohérence liste ↔ détail : chaque slug listé est consultable et identique', async ({
    request,
  }) => {
    const { data: list } = await (await request.get('/api/articles', { params: { pageSize: 50 } })).json();
    expect(list).toHaveLength(SEED.totalArticles);

    const details = await Promise.all(
      list.map(async (item: { slug: string }) => {
        const response = await request.get(`/api/articles/${item.slug}`);
        expect(response.status(), item.slug).toBe(200);
        return (await response.json()).data;
      }),
    );

    details.forEach((detail, index) => {
      const { body: _body, ...summary } = detail;
      expect(summary).toEqual(list[index]);
    });
  });

  test('ART-API-103 @REQ-ART-03 slug inconnu : 404 NOT_FOUND au format d’erreur standard', async ({ request }) => {
    const response = await request.get('/api/articles/article-qui-nexiste-pas');
    await expectApiError(response, 404, 'NOT_FOUND');
  });

  test('ART-API-104 @REQ-ART-03 le slug est sensible à la casse', async ({ request }) => {
    const response = await request.get(`/api/articles/${KNOWN_ARTICLE.slug.toUpperCase()}`);
    await expectApiError(response, 404, 'NOT_FOUND');
  });

  test('ART-API-105 @REQ-ART-03 tentative de path traversal : 404 sans fuite d’information', async ({ request }) => {
    const response = await request.get('/api/articles/..%2F..%2Fetc%2Fpasswd');
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('root:');
  });

  test('ART-API-106 @REQ-ART-03 slug démesuré (2 000 caractères) : 404, jamais 5xx', async ({ request }) => {
    const response = await request.get(`/api/articles/${'a'.repeat(2000)}`);
    expect(response.status()).toBe(404);
  });

  test('ART-API-107 @REQ-ART-03 méthode non autorisée : POST → 405', async ({ request }) => {
    const response = await request.post(`/api/articles/${KNOWN_ARTICLE.slug}`, { data: {} });
    expect(response.status()).toBe(405);
  });
});
