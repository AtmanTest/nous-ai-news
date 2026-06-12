import type { SourceConfig, NormalizedArticle, IngestionResult } from './types';
import { normalizeArticle } from './normalize';
import { batchDeduplicate } from './dedupe';
import { calculateScore, calculateTrendingScore } from './rank';
import { enrichArticle } from './enrich';

/**
 * Ingestion engine: orchestrates fetching, parsing, deduplicating,
 * enriching, scoring, and storing articles.
 */
export class IngestionEngine {
  private existingArticles: Array<{ url: string; title: string; content: string | null; id: string; url_hash: string }> = [];

  constructor(
    private options: {
      onStore?: (articles: NormalizedArticle[]) => Promise<void>;
      onLog?: (result: IngestionResult) => Promise<void>;
    } = {}
  ) {}

  /**
   * Set existing articles for deduplication context
   */
  setExisting(existing: Array<{ url: string; title: string; content: string | null; id: string; url_hash: string }>) {
    this.existingArticles = existing;
  }

  /**
   * Process articles from a source: normalize → dedupe → enrich → score → store
   */
  async processArticles(
    rawArticles: Array<{
      url: string;
      title: string;
      summary?: string;
      content?: string;
      author?: string;
      published_at?: string;
      image_url?: string;
      tags?: string[];
    }>,
    source: SourceConfig
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let newCount = 0;
    let dupCount = 0;

    // Step 1: Normalize
    const normalized: NormalizedArticle[] = [];
    for (const raw of rawArticles) {
      try {
        const article = normalizeArticle(
          {
            ...raw,
            source_name: source.name,
            source_type: source.type,
            source_url: source.url,
          },
          source.id
        );
        normalized.push(article);
      } catch (error) {
        errors.push(`Normalize error for ${raw.url}: ${error}`);
      }
    }

    // Step 2: Deduplicate
    const { newArticles, duplicates } = batchDeduplicate(normalized, this.existingArticles);
    newCount = newArticles.length;
    dupCount = duplicates.length;

    // Step 3: Enrich new articles
    const enriched = newArticles.map(enrichArticle);

    // Step 4: Score
    const scored = enriched.map((article) => ({
      ...article,
      score: calculateScore(article, source.tier),
      trending_score: calculateTrendingScore(article, source.tier),
    }));

    // Step 5: Store
    if (scored.length > 0 && this.options.onStore) {
      await this.options.onStore(scored);

      // Update existing articles cache
      for (const article of scored) {
        this.existingArticles.push({
          url: article.url,
          title: article.title,
          content: article.content,
          id: article.source_id,
          url_hash: '', // Will be computed by DB
        });
      }
    }

    const result: IngestionResult = {
      source_id: source.id,
      source_name: source.name,
      total: rawArticles.length,
      new: newCount,
      duplicates: dupCount,
      errors: errors.length,
      duration_ms: Date.now() - startTime,
      error_details: errors.length > 0 ? errors : undefined,
    };

    if (this.options.onLog) {
      await this.options.onLog(result);
    }

    return result;
  }

  /**
   * Process multiple sources
   */
  async processSources(
    sources: SourceConfig[],
    fetchFn: (source: SourceConfig) => Promise<Array<{
      url: string; title: string; summary?: string; content?: string;
      author?: string; published_at?: string; image_url?: string; tags?: string[];
    }>>
  ): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];

    for (const source of sources) {
      try {
        const articles = await fetchFn(source);
        const result = await this.processArticles(articles, source);
        results.push(result);
      } catch (error) {
        results.push({
          source_id: source.id,
          source_name: source.name,
          total: 0,
          new: 0,
          duplicates: 0,
          errors: 1,
          duration_ms: 0,
          error_details: [`Source fetch failed: ${error}`],
        });
      }
    }

    return results;
  }
}
