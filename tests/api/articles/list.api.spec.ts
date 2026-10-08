import { expect, test } from '@playwright/test';
import { ARTICLE_SUMMARY_KEYS, expectApiError } from '../../support/api';
import { OLDEST_SLUG, SEED } from '../../support/seed';

test.describe('Articles — GET /api/articles', () => {
  test('ART-API-001 @smoke @REQ-ART-01 liste par défaut : 200, 9 articles, méta de pagination', async ({ request }) => {
    const response = await request.get('/api/articles');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body.data).toHaveLength(SEED.defaultPageSize);
    expect(body.meta).toEqual({ page: 1, pageSize: 9, total: SEED.totalArticles, totalPages: 2 });
  });

  test('ART-API-002 @REQ-ART-01 contrat : chaque article expose exactement les champs du résumé (jamais le corps)', async ({
    request,
  }) => {
    const { data } = await (await request.get('/api/articles', { params: { pageSize: 50 } })).json();
    for (const item of data) {
      expect(Object.keys(item).sort()).toEqual(ARTICLE_SUMMARY_KEYS);
      expect(Date.parse(item.publishedAt)).not.toBeNaN();
      expect(Array.isArray(item.tags)).toBe(true);
    }
  });

  test('ART-API-003 @REQ-ART-01 tri par défaut : du plus récent au plus ancien (page 1)', async ({ request }) => {
    const { data } = await (await request.get('/api/articles')).json();
    expect(data.map((a: { slug: string }) => a.slug)).toEqual([...SEED.page1Slugs]);
  });

  test('ART-API-004 @REQ-ART-01 la page 2 suit la page 1 sans chevauchement', async ({ request }) => {
    const { data, meta } = await (await request.get('/api/articles', { params: { page: 2 } })).json();
    expect(meta.page).toBe(2);
    expect(data.map((a: { slug: string }) => a.slug)).toEqual([...SEED.page2Slugs]);
  });

  test('ART-API-005 @REQ-ART-01 sort=oldest : l’article le plus ancien arrive en premier', async ({ request }) => {
    const { data } = await (await request.get('/api/articles', { params: { sort: 'oldest', pageSize: 1 } })).json();
    expect(data).toHaveLength(1);
    expect(data[0].slug).toBe(OLDEST_SLUG);
  });

  test('ART-API-006 @REQ-ART-01 valeur limite basse : pageSize=1 → 1 article, 18 pages', async ({ request }) => {
    const { data, meta } = await (await request.get('/api/articles', { params: { pageSize: 1 } })).json();
    expect(data).toHaveLength(1);
    expect(meta.totalPages).toBe(SEED.totalArticles);
  });

  test('ART-API-007 @REQ-ART-01 valeur limite haute : pageSize=50 → tout sur une page', async ({ request }) => {
    const { data, meta } = await (await request.get('/api/articles', { params: { pageSize: 50 } })).json();
    expect(data).toHaveLength(SEED.totalArticles);
    expect(meta.totalPages).toBe(1);
  });

  test('ART-API-008 @REQ-ART-01 page au-delà de la dernière : 200 avec liste vide et méta cohérentes', async ({
    request,
  }) => {
    const response = await request.get('/api/articles', { params: { page: 3 } });
    expect(response.status()).toBe(200);
    const { data, meta } = await response.json();
    expect(data).toEqual([]);
    expect(meta).toMatchObject({ page: 3, total: SEED.totalArticles, totalPages: 2 });
  });

  test.describe('paramètres invalides → 400 INVALID_PARAMETER (partitions d’équivalence invalides)', () => {
    const invalid: Array<[string, string, string]> = [
      ['page', '0', 'limite basse − 1'],
      ['page', '-1', 'négatif'],
      ['page', '1.5', 'décimal'],
      ['page', 'abc', 'non numérique'],
      ['page', '', 'chaîne vide'],
      ['pageSize', '0', 'limite basse − 1'],
      ['pageSize', '51', 'limite haute + 1'],
      ['pageSize', 'abc', 'non numérique'],
      ['category', 'unknown', 'thématique inconnue'],
      ['category', 'MODELS', 'casse différente'],
      ['sort', 'random', 'valeur hors énumération'],
    ];

    for (const [param, value, why] of invalid) {
      test(`ART-API-009 @REQ-ART-01 ${param}=${JSON.stringify(value)} (${why})`, async ({ request }) => {
        const response = await request.get('/api/articles', { params: { [param]: value } });
        const body = await expectApiError(response, 400, 'INVALID_PARAMETER');
        expect(body.error.details?.map((d) => d.field)).toEqual([param]);
      });
    }
  });

  test('ART-API-010 @REQ-ART-01 toutes les erreurs de validation sont signalées en une seule réponse', async ({
    request,
  }) => {
    const response = await request.get('/api/articles', {
      params: { page: 0, pageSize: 51, category: 'x', sort: 'y' },
    });
    const body = await expectApiError(response, 400, 'INVALID_PARAMETER');
    expect(body.error.details?.map((d) => d.field).sort()).toEqual(['category', 'page', 'pageSize', 'sort']);
  });

  for (const category of SEED.categories) {
    test(`ART-API-011 @REQ-ART-02 filtre category=${category} : ${SEED.perCategory} articles de cette thématique`, async ({
      request,
    }) => {
      const { data, meta } = await (await request.get('/api/articles', { params: { category } })).json();
      expect(meta.total).toBe(SEED.perCategory);
      expect(data).toHaveLength(SEED.perCategory);
      expect(data.every((a: { category: string }) => a.category === category)).toBe(true);
    });
  }

  test('ART-API-012 @REQ-ART-02 filtre et pagination se combinent (category=agents, pageSize=2, page=2)', async ({
    request,
  }) => {
    const { data, meta } = await (
      await request.get('/api/articles', { params: { category: 'agents', pageSize: 2, page: 2 } })
    ).json();
    expect(data).toHaveLength(1);
    expect(meta).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
  });

  test('ART-API-013 @REQ-ART-01 lecture sans effet de bord : deux appels identiques donnent le même résultat', async ({
    request,
  }) => {
    const first = await (await request.get('/api/articles')).json();
    const second = await (await request.get('/api/articles')).json();
    expect(second).toEqual(first);
  });

  test('ART-API-014 @REQ-ART-01 un paramètre inconnu est ignoré (pas d’erreur)', async ({ request }) => {
    const response = await request.get('/api/articles', { params: { foo: 'bar' } });
    expect(response.status()).toBe(200);
  });

  test('ART-API-015 @REQ-ART-01 budget de performance : réponse en moins de 3 s', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/api/articles');
    expect(response.ok()).toBe(true);
    expect(Date.now() - start).toBeLessThan(3000);
  });
});
