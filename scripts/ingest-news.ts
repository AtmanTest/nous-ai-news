import { fetchRSS } from '../lib/rss/parser';
import { IngestionEngine } from '../lib/content/engine';
import { getActiveSources } from '../lib/content/sources';
import { storeArticles, fetchExistingArticles, logIngestion } from '../lib/content/store';
import type { SourceConfig } from '../lib/content/types';

/**
 * Main ingestion script — fetches all active RSS sources,
 * normalizes, deduplicates, enriches, scores, and stores articles.
 *
 * Run: npx tsx scripts/ingest-news.ts
 */

async function main() {
  console.log('[Ingest] Starting news ingestion...');

  const sources = getActiveSources();
  const rssSources = sources.filter((s) => s.type === 'rss');
  console.log(`[Ingest] Found ${rssSources.length} active RSS sources`);

  // Fetch existing articles for dedup context
  const existingArticles = await fetchExistingArticles();
  console.log(`[Ingest] Loaded ${existingArticles.length} existing articles for dedup`);

  const engine = new IngestionEngine({
    onStore: async (articles) => {
      const result = await storeArticles(articles);
      console.log(`[Ingest] Stored ${result.stored} articles (${result.errors} errors)`);
    },
    onLog: async (result) => {
      await logIngestion(result);
      console.log(
        `[Ingest] Source "${result.source_name}": ${result.new} new / ${result.duplicates} dup / ${result.errors} err in ${result.duration_ms}ms`
      );
    },
  });

  engine.setExisting(existingArticles);

  // Process all RSS sources
  const results = await engine.processSources(rssSources, async (source: SourceConfig) => {
    const feed = await fetchRSS(source.url);
    if (feed.error) {
      console.warn(`[Ingest] RSS error for ${source.name}: ${feed.error}`);
      return [];
    }

    // Return raw items — engine handles normalization internally
    const items = feed.items.map((item) => ({
      url: item.link,
      title: item.title,
      summary: item.description,
      content: item.content,
      author: item.author,
      published_at: item.pubDate,
      image_url: item.image,
      tags: item.categories,
    }));
    console.log(`[Ingest] Fetched ${items.length} items from ${source.name}`);
    return items;
  });

  const totalNew = results.reduce((sum, r) => sum + r.new, 0);
  const totalDup = results.reduce((sum, r) => sum + r.duplicates, 0);
  const totalErr = results.reduce((sum, r) => sum + r.errors, 0);

  console.log('\n═══════════════════════════════════');
  console.log(`[Ingest] Done! ${totalNew} new / ${totalDup} dup / ${totalErr} err from ${results.length} sources`);
  console.log('═══════════════════════════════════\n');

  // Print per-source summary
  for (const r of results) {
    const status = r.errors > 0 ? '⚠' : '✓';
    console.log(`  ${status} ${r.source_name}: ${r.new} new, ${r.duplicates} dup (${r.duration_ms}ms)`);
  }
}

main().catch((err) => {
  console.error('[Ingest] Fatal error:', err);
  process.exit(1);
});
