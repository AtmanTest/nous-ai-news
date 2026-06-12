export interface RawArticle {
  url: string;
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  published_at?: string;
  image_url?: string;
  source_name: string;
  source_type: 'rss' | 'api' | 'social' | 'newsapi';
  source_url: string;
  external_id?: string;
  category?: string;
  tags?: string[];
}

export interface NormalizedArticle {
  url: string;
  title: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  published_at: string | null;
  image_url: string | null;
  source_name: string;
  source_type: 'rss' | 'api' | 'social' | 'newsapi';
  source_id: string;
  external_id: string | null;
  language: string;
  category: string | null;
  tags: string[];
  entities: ArticleEntity[];
  score: number;
  is_breaking: boolean;
}

export interface ArticleEntity {
  type: 'model' | 'company' | 'person' | 'product' | 'country' | 'research';
  name: string;
  confidence: number;
}

export interface DedupResult {
  is_duplicate: boolean;
  match_type?: 'exact_url' | 'title_similar' | 'content_fingerprint';
  existing_id?: string;
  similarity?: number;
}

export interface SourceConfig {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'social' | 'newsapi';
  url: string;
  site_url?: string;
  feed_url?: string;
  tier: number;
  language: string;
  country?: string;
  category: 'research' | 'company' | 'media' | 'community' | 'newsletter';
  topics?: string[];
  active?: boolean;
  fetch_interval?: number;
}

export interface IngestionResult {
  source_id: string;
  source_name: string;
  total: number;
  new: number;
  duplicates: number;
  errors: number;
  duration_ms: number;
  error_details?: string[];
}
