import type { CategorySlug } from '@/modules/topics/topics';

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  /** Paragraphes du corps de l'article. */
  body: string[];
  category: CategorySlug;
  tags: string[];
  source: string;
  /** Date ISO 8601 (UTC). */
  publishedAt: string;
  readingMinutes: number;
  /** Lien vers l'article original (contenu ingéré automatiquement). */
  sourceUrl?: string;
}

export type ArticleSummary = Omit<Article, 'body'>;

export type SortOrder = 'newest' | 'oldest';

export interface ListParams {
  page: number;
  pageSize: number;
  category?: CategorySlug;
  sort: SortOrder;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResult {
  items: ArticleSummary[];
  meta: PageMeta;
}
