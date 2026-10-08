import { ARTICLES } from './data';
import type { Article, ArticleSummary, ListParams, ListResult, SortOrder } from './types';

export function toSummary(article: Article): ArticleSummary {
  const { body: _body, ...summary } = article;
  return summary;
}

function compareArticles(sort: SortOrder) {
  const newestFirst = sort === 'newest';
  return (a: Article, b: Article): number => {
    if (a.publishedAt !== b.publishedAt) {
      const aIsOlder = a.publishedAt < b.publishedAt;
      // newest : le plus ancien passe après ; oldest : le plus ancien passe avant.
      return aIsOlder === newestFirst ? 1 : -1;
    }
    // Ordre total stable : départage par slug.
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  };
}

export function listArticles(params: ListParams, source: readonly Article[] = ARTICLES): ListResult {
  const filtered = params.category ? source.filter((a) => a.category === params.category) : [...source];
  filtered.sort(compareArticles(params.sort));

  const total = filtered.length;
  const totalPages = Math.ceil(total / params.pageSize);
  const start = (params.page - 1) * params.pageSize;

  return {
    items: filtered.slice(start, start + params.pageSize).map(toSummary),
    meta: { page: params.page, pageSize: params.pageSize, total, totalPages },
  };
}

export function getArticleBySlug(slug: string, source: readonly Article[] = ARTICLES): Article | undefined {
  return source.find((article) => article.slug === slug);
}

export function getRelatedArticles(article: Article, limit = 2, source: readonly Article[] = ARTICLES): ArticleSummary[] {
  return source
    .filter((candidate) => candidate.category === article.category && candidate.id !== article.id)
    .sort(compareArticles('newest'))
    .slice(0, limit)
    .map(toSummary);
}
