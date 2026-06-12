export interface Article {
  id: string;
  source_id: string;
  url: string;
  title: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  published_at: string;
  fetched_at: string;
  language: string;
  image_url: string | null;
  source_name: string;
  category: string | null;
  tags: string[];
  entities: Entity[];
  score: number;
  trending_score: number;
  is_featured: boolean;
  is_breaking: boolean;
  created_at: string;
}

export interface Entity {
  type: 'model' | 'company' | 'person' | 'product' | 'country';
  name: string;
  confidence: number;
}

export interface Source {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'social' | 'newsapi';
  url: string;
  tier: number;
  language: string;
  country: string | null;
  category: string | null;
  is_active: boolean;
  last_fetch: string | null;
  fetch_interval: number;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  preferred_countries: string[];
  followed_topics: string[];
  is_admin: boolean;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  note: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  article_count: number;
}

export interface ArticleWithBookmark extends Article {
  is_bookmarked?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type SortOption = 'newest' | 'trending' | 'score';
