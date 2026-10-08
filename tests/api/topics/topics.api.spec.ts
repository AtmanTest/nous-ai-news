import { expect, test } from '@playwright/test';
import { SEED } from '../../support/seed';

test.describe('Thématiques — GET /api/topics', () => {
  test('TOP-API-001 @smoke @REQ-TOP-01 retourne les 6 thématiques avec libellé, description et compteur', async ({
    request,
  }) => {
    const response = await request.get('/api/topics');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const { data } = await response.json();
    expect(data.map((t: { slug: string }) => t.slug)).toEqual([...SEED.categories]);
    for (const topic of data) {
      expect(Object.keys(topic).sort()).toEqual(['count', 'description', 'label', 'slug']);
      expect(topic.label).toBe(SEED.categoryLabels[topic.slug]);
      expect(topic.description.length).toBeGreaterThan(0);
      expect(topic.count).toBe(SEED.perCategory);
    }
  });

  test('TOP-API-002 @REQ-TOP-01 conservation : la somme des compteurs égale le total d’articles', async ({ request }) => {
    const { data } = await (await request.get('/api/topics')).json();
    const { meta } = await (await request.get('/api/articles')).json();
    const sum = data.reduce((acc: number, topic: { count: number }) => acc + topic.count, 0);
    expect(sum).toBe(meta.total);
  });

  test('TOP-API-003 @REQ-TOP-01 chaque compteur correspond au filtre /api/articles?category=…', async ({ request }) => {
    const { data } = await (await request.get('/api/topics')).json();
    for (const topic of data) {
      const { meta } = await (await request.get('/api/articles', { params: { category: topic.slug } })).json();
      expect(meta.total, topic.slug).toBe(topic.count);
    }
  });

  test('TOP-API-004 @REQ-TOP-01 libellés et slugs uniques', async ({ request }) => {
    const { data } = await (await request.get('/api/topics')).json();
    expect(new Set(data.map((t: { label: string }) => t.label)).size).toBe(data.length);
    expect(new Set(data.map((t: { slug: string }) => t.slug)).size).toBe(data.length);
  });

  test('TOP-API-005 @REQ-TOP-01 méthode non autorisée : POST → 405', async ({ request }) => {
    expect((await request.post('/api/topics', { data: {} })).status()).toBe(405);
  });
});
