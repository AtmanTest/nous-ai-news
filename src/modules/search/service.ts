import { ARTICLES } from '@/modules/articles/data';
import { toSummary } from '@/modules/articles/service';
import type { Article, ArticleSummary } from '@/modules/articles/types';
import type { CategorySlug } from '@/modules/topics/topics';

/** Pondération par champ : un terme trouvé dans le titre pèse plus que dans le corps. */
export const WEIGHTS = { title: 5, tags: 3, summary: 2, body: 1 } as const;

export interface SearchResult extends ArticleSummary {
  score: number;
}

export interface SearchOutcome {
  results: SearchResult[];
  /** Nombre total de correspondances avant application de `limit`. */
  total: number;
}

/** Minuscules, sans accents (NFD), espaces normalisés. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(query: string): string[] {
  const normalized = normalize(query);
  return normalized === '' ? [] : Array.from(new Set(normalized.split(' ')));
}

function scoreArticle(article: Article, terms: string[]): number {
  const fields = {
    title: normalize(article.title),
    tags: normalize(article.tags.join(' ')),
    summary: normalize(article.summary),
    body: normalize(article.body.join(' ')),
  };

  let total = 0;
  for (const term of terms) {
    let termScore = 0;
    if (fields.title.includes(term)) termScore += WEIGHTS.title;
    if (fields.tags.includes(term)) termScore += WEIGHTS.tags;
    if (fields.summary.includes(term)) termScore += WEIGHTS.summary;
    if (fields.body.includes(term)) termScore += WEIGHTS.body;
    // Sémantique ET : chaque terme doit apparaître quelque part.
    if (termScore === 0) return 0;
    total += termScore;
  }
  return total;
}

export function searchArticles(
  query: { q: string; category?: CategorySlug; limit: number },
  source: readonly Article[] = ARTICLES,
): SearchOutcome {
  const terms = tokenize(query.q);
  if (terms.length === 0) return { results: [], total: 0 };

  const matches = source
    .filter((article) => !query.category || article.category === query.category)
    .map((article) => ({ article, score: scoreArticle(article, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.article.publishedAt !== b.article.publishedAt) return a.article.publishedAt < b.article.publishedAt ? 1 : -1;
      return a.article.slug < b.article.slug ? -1 : 1;
    });

  return {
    total: matches.length,
    results: matches.slice(0, query.limit).map(({ article, score }) => ({ ...toSummary(article), score })),
  };
}
