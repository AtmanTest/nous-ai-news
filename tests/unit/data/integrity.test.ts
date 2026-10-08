import { describe, expect, it } from 'vitest';
import { ARTICLES } from '@/modules/articles/data';
import { listArticles } from '@/modules/articles/service';
import { CATEGORY_SLUGS } from '@/modules/topics/topics';
import { KNOWN_ARTICLE, NEWEST_SLUG, OLDEST_SLUG, SEED } from '../../support/seed';

/**
 * [REQ-PLT-07] Qualité des données — le jeu de démonstration est lui-même un artefact à tester.
 * Technique : test statique sur les invariants de données (partitions valides/invalides).
 */
describe('[REQ-PLT-07] intégrité du jeu de données', () => {
  it('contient le nombre d’articles attendu', () => {
    expect(ARTICLES).toHaveLength(SEED.totalArticles);
  });

  it('a des identifiants et des slugs uniques', () => {
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length);
    expect(new Set(ARTICLES.map((a) => a.slug)).size).toBe(ARTICLES.length);
  });

  it.each(ARTICLES.map((a) => [a.slug, a] as const))('%s : slug en kebab-case sans accent', (_slug, article) => {
    expect(article.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(ARTICLES.map((a) => [a.slug, a] as const))('%s : champs obligatoires renseignés', (_slug, article) => {
    expect(article.title.trim()).toBe(article.title);
    expect(article.title.length).toBeGreaterThan(10);
    expect(article.summary.length).toBeGreaterThan(20);
    expect(article.body.length).toBeGreaterThanOrEqual(2);
    expect(article.body.every((p) => p.trim().length > 40)).toBe(true);
    expect(article.tags.length).toBeGreaterThanOrEqual(2);
    expect(Number.isInteger(article.readingMinutes) && article.readingMinutes > 0).toBe(true);
    expect(CATEGORY_SLUGS).toContain(article.category);
  });

  it('a des dates ISO valides et toutes distinctes (tri déterministe)', () => {
    const dates = ARTICLES.map((a) => a.publishedAt);
    expect(dates.every((d) => !Number.isNaN(Date.parse(d)))).toBe(true);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('répartit les articles à parts égales entre les thématiques', () => {
    for (const category of SEED.categories) {
      expect(ARTICLES.filter((a) => a.category === category)).toHaveLength(SEED.perCategory);
    }
  });

  describe('cohérence des constantes de test (tests/support/seed.ts)', () => {
    it('page 1 et page 2 correspondent au tri « newest »', () => {
      const page1 = listArticles({ page: 1, pageSize: 9, sort: 'newest' }).items.map((a) => a.slug);
      const page2 = listArticles({ page: 2, pageSize: 9, sort: 'newest' }).items.map((a) => a.slug);
      expect(page1).toEqual([...SEED.page1Slugs]);
      expect(page2).toEqual([...SEED.page2Slugs]);
    });

    it('article le plus récent et le plus ancien', () => {
      const sorted = [...ARTICLES].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
      expect(sorted[0]?.slug).toBe(NEWEST_SLUG);
      expect(sorted.at(-1)?.slug).toBe(OLDEST_SLUG);
    });

    it('article de référence et ses articles liés', () => {
      const article = ARTICLES.find((a) => a.slug === KNOWN_ARTICLE.slug);
      expect(article?.title).toBe(KNOWN_ARTICLE.title);
      expect(article?.category).toBe(KNOWN_ARTICLE.category);
      const sameCategory = ARTICLES.filter((a) => a.category === KNOWN_ARTICLE.category && a.slug !== KNOWN_ARTICLE.slug)
        .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
        .map((a) => a.slug);
      expect(sameCategory).toEqual([...KNOWN_ARTICLE.relatedSlugs]);
    });
  });
});
