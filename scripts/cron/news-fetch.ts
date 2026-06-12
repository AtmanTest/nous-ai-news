import { getActiveSources } from '../../lib/content/sources';
import { fetchRSS } from '../../lib/rss/parser';
import type { NormalizedArticle } from '../../lib/content/types';

/**
 * Fetch articles from all active RSS/news sources
 */
export async function fetchAllSources(): Promise<NormalizedArticle[]> {
  const sources = getActiveSources();
  const results: NormalizedArticle[] = [];
  const errors: string[] = [];

  for (const source of sources) {
    try {
      if (source.type === 'rss') {
        const feed = await fetchRSS(source.url);
        if (feed.error) {
          errors.push(`${source.name}: ${feed.error}`);
          continue;
        }
        // Convert feed items
        for (const item of feed.items) {
          results.push({
            url: item.link,
            title: item.title,
            summary: item.description || null,
            content: item.content || null,
            author: item.author || null,
            published_at: item.pubDate || null,
            image_url: item.image || null,
            source_name: source.name,
            source_type: 'rss',
            source_id: source.id,
            external_id: null,
            language: source.language,
            category: null,
            tags: item.categories || [],
            entities: [],
            score: 0,
            is_breaking: false,
          });
        }
      }
    } catch (err) {
      errors.push(`${source.name}: fetch error`);
    }
  }

  if (errors.length > 0) {
    console.warn(`[NewsFetch] ${errors.length} source(s) had errors`);
    errors.forEach((e) => console.warn(`  ⚠ ${e}`));
  }

  return results;
}
