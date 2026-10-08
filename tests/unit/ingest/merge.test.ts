import { describe, expect, it } from 'vitest';
import { ARTICLES, SEED_ARTICLES, resolveArticles } from '@/modules/articles/data';
import type { Article } from '@/modules/articles/types';
import { mergeArticles } from '@/modules/ingest/merge';

const NOW = new Date('2026-10-08T12:00:00Z');
const OPTIONS = { maxItems: 100, maxAgeDays: 30, now: NOW };

function art(id: string, overrides: Partial<Article> = {}): Article {
  return {
    id,
    slug: id,
    title: `Titre ${id}`,
    summary: 's',
    body: ['s'],
    category: 'models',
    tags: [],
    source: 'x',
    sourceUrl: `https://exemple.fr/${id}`,
    publishedAt: '2026-10-07T00:00:00.000Z',
    readingMinutes: 1,
    ...overrides,
  };
}

describe('[REQ-ING-03] mergeArticles', () => {
  it('dédoublonne par URL canonique (suivi ignoré) en gardant l’existant', () => {
    const existing = [art('a')];
    const incoming = [art('a2', { sourceUrl: 'https://exemple.fr/a?utm_source=x', title: 'Autre titre' })];
    expect(mergeArticles(existing, incoming, OPTIONS).map((a) => a.id)).toEqual(['a']);
  });

  it('dédoublonne par titre identique (casse et ponctuation ignorées)', () => {
    const merged = mergeArticles([art('a', { title: 'Hello, World!' })], [art('b', { title: 'hello world' })], OPTIONS);
    expect(merged).toHaveLength(1);
  });

  it('purge les articles plus vieux que la limite (29 / 30 / 31 jours)', () => {
    const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
    const merged = mergeArticles([], [art('d29', { publishedAt: day(29) }), art('d30', { publishedAt: day(30) }), art('d31', { publishedAt: day(31) })], OPTIONS);
    expect(merged.map((a) => a.id)).toEqual(['d29', 'd30']);
  });

  it('trie du plus récent au plus ancien, départage par identifiant', () => {
    const merged = mergeArticles(
      [],
      [art('b', { publishedAt: '2026-10-05T00:00:00Z' }), art('c', { publishedAt: '2026-10-07T00:00:00Z' }), art('a', { publishedAt: '2026-10-07T00:00:00Z' })],
      OPTIONS,
    );
    expect(merged.map((a) => a.id)).toEqual(['a', 'c', 'b']);
  });

  it('plafonne le volume en gardant les plus récents', () => {
    const many = Array.from({ length: 5 }, (_, i) => art(`n${i}`, { publishedAt: `2026-10-0${i + 1}T00:00:00Z` }));
    expect(mergeArticles([], many, { ...OPTIONS, maxItems: 2 }).map((a) => a.id)).toEqual(['n4', 'n3']);
  });

  it('est idempotent : fusionner deux fois donne le même résultat', () => {
    const once = mergeArticles([art('a')], [art('b', { publishedAt: '2026-10-06T00:00:00Z' })], OPTIONS);
    expect(mergeArticles(once, once, OPTIONS)).toEqual(once);
  });

  it('conserve les articles sans URL source (dédoublonnés par titre seulement)', () => {
    const { sourceUrl: _omit, ...noUrl } = art('seed');
    expect(mergeArticles([noUrl as Article], [], OPTIONS)).toHaveLength(1);
  });
});

describe('[REQ-ING-03] resolveArticles', () => {
  const live = [art('live')];

  it('sert le contenu ingéré par défaut', () => {
    expect(resolveArticles(undefined, live)).toBe(live);
  });

  it('force le jeu de démonstration avec NOUS_CONTENT=seed', () => {
    expect(resolveArticles('seed', live)).toBe(SEED_ARTICLES);
  });

  it('retombe sur le jeu de démonstration si rien n’a été ingéré', () => {
    expect(resolveArticles(undefined, [])).toBe(SEED_ARTICLES);
  });

  it('les tests tournent sur le jeu de démonstration (déterminisme)', () => {
    expect(ARTICLES).toBe(SEED_ARTICLES);
  });
});
