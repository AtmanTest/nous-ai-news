import { expect, test } from '@playwright/test';
import { ARTICLE_SUMMARY_KEYS, expectApiError } from '../../support/api';

const search = (q: string, extra: Record<string, string | number> = {}) => ({ params: { q, ...extra } });

test.describe('Recherche — GET /api/search', () => {
  test('SRC-API-001 @smoke @REQ-SRC-01 recherche par mot du titre : 1 résultat pertinent avec son score', async ({
    request,
  }) => {
    const response = await request.get('/api/search', search('interpretabilite'));
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body.meta).toEqual({ query: 'interpretabilite', total: 1, returned: 1 });
    expect(body.data[0].slug).toBe('interpretabilite-circuits-internes');
    expect(body.data[0].score).toBeGreaterThan(0);
  });

  test('SRC-API-002 @REQ-SRC-01 contrat : résumé + score, jamais le corps', async ({ request }) => {
    const { data } = await (await request.get('/api/search', search('agents'))).json();
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(Object.keys(item).sort()).toEqual([...ARTICLE_SUMMARY_KEYS, 'score'].sort());
    }
  });

  test('SRC-API-003 @REQ-SRC-01 insensible aux accents : « modèles » ≡ « modeles »', async ({ request }) => {
    const accented = await (await request.get('/api/search', search('modèles'))).json();
    const plain = await (await request.get('/api/search', search('modeles'))).json();
    expect(accented.data.length).toBeGreaterThan(0);
    expect(accented.data).toEqual(plain.data);
  });

  test('SRC-API-004 @REQ-SRC-01 insensible à la casse : « AGENTS » ≡ « agents »', async ({ request }) => {
    const upper = await (await request.get('/api/search', search('AGENTS'))).json();
    const lower = await (await request.get('/api/search', search('agents'))).json();
    expect(upper.data).toEqual(lower.data);
  });

  test('SRC-API-005 @REQ-SRC-01 sémantique ET : un terme de plus restreint les résultats', async ({ request }) => {
    const one = await (await request.get('/api/search', search('agents'))).json();
    const two = await (await request.get('/api/search', search('agents codage'))).json();
    expect(one.meta.total).toBeGreaterThan(two.meta.total);
    expect(two.data.map((a: { slug: string }) => a.slug)).toEqual(['agents-codage-revue-humaine']);
  });

  test('SRC-API-006 @REQ-SRC-01 aucun résultat : 200 avec liste vide (ce n’est pas une erreur)', async ({ request }) => {
    const response = await request.get('/api/search', search('zzzzqqqq'));
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ data: [], meta: { query: 'zzzzqqqq', total: 0, returned: 0 } });
  });

  test('SRC-API-007 @REQ-SRC-02 paramètre q absent : 400 avec détail sur « q »', async ({ request }) => {
    const body = await expectApiError(await request.get('/api/search'), 400, 'INVALID_PARAMETER');
    expect(body.error.details?.map((d) => d.field)).toEqual(['q']);
  });

  test.describe('analyse des valeurs limites : longueur de q', () => {
    const cases: Array<[number, number]> = [
      [1, 400],
      [2, 200],
      [3, 200],
      [99, 200],
      [100, 200],
      [101, 400],
    ];
    for (const [length, status] of cases) {
      test(`SRC-API-008 @REQ-SRC-02 q de ${length} caractères → ${status}`, async ({ request }) => {
        const response = await request.get('/api/search', search('a'.repeat(length)));
        expect(response.status()).toBe(status);
      });
    }
  });

  test('SRC-API-009 @REQ-SRC-02 q composé uniquement d’espaces : 400', async ({ request }) => {
    await expectApiError(await request.get('/api/search', search('    ')), 400, 'INVALID_PARAMETER');
  });

  test('SRC-API-010 @REQ-SRC-01 filtre category : tous les résultats appartiennent à la thématique', async ({
    request,
  }) => {
    const { data } = await (await request.get('/api/search', search('evaluation', { category: 'agents' }))).json();
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((a: { category: string }) => a.category === 'agents')).toBe(true);
  });

  test('SRC-API-011 @REQ-SRC-02 category inconnue : 400', async ({ request }) => {
    const body = await expectApiError(
      await request.get('/api/search', search('agents', { category: 'nope' })),
      400,
      'INVALID_PARAMETER',
    );
    expect(body.error.details?.map((d) => d.field)).toEqual(['category']);
  });

  test('SRC-API-012 @REQ-SRC-01 limit tronque les résultats, total reste global', async ({ request }) => {
    const all = await (await request.get('/api/search', search('evaluation'))).json();
    const limited = await (await request.get('/api/search', search('evaluation', { limit: 2 }))).json();
    expect(limited.data).toHaveLength(2);
    expect(limited.meta).toMatchObject({ total: all.meta.total, returned: 2 });
    expect(limited.data).toEqual(all.data.slice(0, 2));
  });

  for (const limit of ['0', '51', 'abc']) {
    test(`SRC-API-013 @REQ-SRC-02 limit=${limit} : 400`, async ({ request }) => {
      await expectApiError(await request.get('/api/search', search('agents', { limit })), 400, 'INVALID_PARAMETER');
    });
  }

  test('SRC-API-014 @REQ-SRC-03 résultats triés par pertinence décroissante', async ({ request }) => {
    const { data } = await (await request.get('/api/search', search('evaluation'))).json();
    const scores = data.map((a: { score: number }) => a.score);
    expect(scores.length).toBeGreaterThan(1);
    expect(scores).toEqual([...scores].sort((a: number, b: number) => b - a));
  });

  test.describe('charges utiles hostiles : jamais d’erreur serveur, toujours du JSON', () => {
    const payloads = [
      '<script>alert(1)</script>',
      "' OR 1=1 --",
      '"; DROP TABLE articles; --',
      '../../etc/passwd',
      '.*',
      '(agents',
      '${7*7}',
      '日本語 🚀 émoji',
      '%s%s%s%n',
    ];
    for (const [index, payload] of payloads.entries()) {
      test(`SRC-API-015 @REQ-SRC-02 charge #${index + 1} : ${payload}`, async ({ request }) => {
        const response = await request.get('/api/search', search(payload));
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        const body = await response.json();
        expect(body.data).toEqual([]);
        expect(body.meta.query).toBe(payload.trim());
      });
    }
  });
});
