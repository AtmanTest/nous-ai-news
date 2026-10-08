import { describe, expect, it } from 'vitest';
import { ARTICLES } from '@/modules/articles/data';
import { getArticleBySlug, getRelatedArticles, listArticles, toSummary } from '@/modules/articles/service';
import type { Article } from '@/modules/articles/types';
import { SEED } from '../../support/seed';

const base = { page: 1, pageSize: 9, sort: 'newest' } as const;

function fakeArticle(overrides: Partial<Article> & Pick<Article, 'slug'>): Article {
  return {
    id: overrides.slug,
    title: overrides.slug,
    summary: 'résumé',
    body: ['corps'],
    category: 'models',
    tags: [],
    source: 'test',
    publishedAt: '2026-01-01T00:00:00Z',
    readingMinutes: 1,
    ...overrides,
  };
}

describe('[REQ-ART-01] listArticles — pagination et tri', () => {
  it('retourne la première page par défaut avec les métadonnées de pagination', () => {
    const { items, meta } = listArticles(base);
    expect(items).toHaveLength(9);
    expect(meta).toEqual({ page: 1, pageSize: 9, total: SEED.totalArticles, totalPages: 2 });
  });

  it('trie du plus récent au plus ancien (newest)', () => {
    const dates = listArticles({ ...base, pageSize: 50 }).items.map((a) => a.publishedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('inverse l’ordre avec sort=oldest', () => {
    const newest = listArticles({ ...base, pageSize: 50 }).items.map((a) => a.slug);
    const oldest = listArticles({ ...base, pageSize: 50, sort: 'oldest' }).items.map((a) => a.slug);
    expect(oldest).toEqual([...newest].reverse());
  });

  it('les pages se partitionnent sans doublon ni oubli', () => {
    const p1 = listArticles({ ...base, page: 1 }).items.map((a) => a.slug);
    const p2 = listArticles({ ...base, page: 2 }).items.map((a) => a.slug);
    expect(new Set([...p1, ...p2]).size).toBe(SEED.totalArticles);
    expect(p1.filter((slug) => p2.includes(slug))).toEqual([]);
  });

  it('pageSize=1 donne autant de pages que d’articles (valeur limite basse)', () => {
    expect(listArticles({ ...base, pageSize: 1 }).meta.totalPages).toBe(SEED.totalArticles);
  });

  it('pageSize=50 tient sur une seule page (valeur limite haute)', () => {
    const { items, meta } = listArticles({ ...base, pageSize: 50 });
    expect(items).toHaveLength(SEED.totalArticles);
    expect(meta.totalPages).toBe(1);
  });

  it('une page au-delà de la dernière est vide mais conserve les métadonnées', () => {
    const { items, meta } = listArticles({ ...base, page: 3 });
    expect(items).toEqual([]);
    expect(meta).toMatchObject({ page: 3, total: SEED.totalArticles, totalPages: 2 });
  });

  it('gère une source vide : 0 total, 0 page', () => {
    expect(listArticles(base, []).meta).toEqual({ page: 1, pageSize: 9, total: 0, totalPages: 0 });
  });

  it('départage les dates identiques par slug (ordre total stable)', () => {
    const same = '2026-05-05T00:00:00Z';
    const source = [fakeArticle({ slug: 'b', publishedAt: same }), fakeArticle({ slug: 'a', publishedAt: same })];
    expect(listArticles(base, source).items.map((a) => a.slug)).toEqual(['a', 'b']);
    expect(listArticles({ ...base, sort: 'oldest' }, source).items.map((a) => a.slug)).toEqual(['a', 'b']);
  });

  it('ne modifie pas la source d’origine', () => {
    const before = ARTICLES.map((a) => a.slug);
    listArticles({ ...base, sort: 'oldest' });
    expect(ARTICLES.map((a) => a.slug)).toEqual(before);
  });

  it('n’expose pas le corps des articles dans la liste', () => {
    expect(listArticles(base).items.every((item) => !('body' in item))).toBe(true);
  });
});

describe('[REQ-ART-02] listArticles — filtre par thématique', () => {
  it.each(SEED.categories)('ne retourne que des articles « %s »', (category) => {
    const { items, meta } = listArticles({ ...base, category });
    expect(items.every((a) => a.category === category)).toBe(true);
    expect(meta.total).toBe(SEED.perCategory);
  });
});

describe('[REQ-ART-03] getArticleBySlug', () => {
  it('retourne l’article complet (avec corps) pour un slug connu', () => {
    const article = getArticleBySlug(SEED.page1Slugs[0]);
    expect(article?.slug).toBe(SEED.page1Slugs[0]);
    expect(article?.body.length).toBeGreaterThan(0);
  });

  it.each(['', 'inconnu', 'MODELES-RAISONNEMENT-LONGUE-DUREE', '../etc/passwd'])('retourne undefined pour %j', (slug) => {
    expect(getArticleBySlug(slug)).toBeUndefined();
  });
});

describe('[REQ-ART-04] getRelatedArticles', () => {
  const article = ARTICLES.find((a) => a.slug === 'agents-codage-revue-humaine')!;

  it('retourne des articles de la même thématique, hors article courant, du plus récent au plus ancien', () => {
    const related = getRelatedArticles(article, 5);
    expect(related.map((a) => a.slug)).toEqual(['agents-outils-protocoles-ouverts', 'evaluation-agents-parcours-longs']);
  });

  it('respecte la limite demandée', () => {
    expect(getRelatedArticles(article, 1)).toHaveLength(1);
  });

  it('retourne une liste vide si aucun autre article n’existe dans la thématique', () => {
    expect(getRelatedArticles(article, 2, [article])).toEqual([]);
  });
});

describe('[REQ-ART-01] toSummary', () => {
  it('retire le corps et conserve les autres champs', () => {
    const summary = toSummary(ARTICLES[0]!);
    expect(summary).not.toHaveProperty('body');
    expect(summary).toMatchObject({ slug: ARTICLES[0]!.slug, title: ARTICLES[0]!.title });
  });
});
