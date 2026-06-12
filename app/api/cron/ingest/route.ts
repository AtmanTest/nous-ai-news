import { NextResponse } from 'next/server';
import { SOURCES } from '@/lib/content/sources';
import { IngestionEngine } from '@/lib/content/engine';
import { storeArticles, fetchExistingArticles, logIngestion } from '@/lib/content/store';
import { fetchRSS, feedItemsToNormalized } from '@/lib/rss/parser';
import { fetchHackerNewsTop, fetchHackerNewsAI } from '@/lib/social/hackernews';
import { fetchRedditAIPosts } from '@/lib/social/reddit';
import type { SourceConfig, NormalizedArticle } from '@/lib/content/types';

// Disable caching — always run fresh on cron ticks
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET: Health check / manual trigger info
 */
export async function GET() {
  const activeSources = SOURCES.filter((s) => s.active);
  return NextResponse.json({
    status: 'ready',
    message: 'POST to this endpoint to trigger ingestion',
    active_sources: activeSources.length,
    sources: activeSources.map((s) => ({ id: s.id, name: s.name, type: s.type, tier: s.tier })),
  });
}

/**
 * POST: Trigger full ingestion cycle
 * Protected by Vercel Cron secret (set CRON_SECRET env var)
 */
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Array<{
    source_id: string;
    source_name: string;
    total: number;
    new: number;
    duplicates: number;
    errors: number;
    duration_ms: number;
    error_details?: string[];
  }> = [];

  try {
    // 1. Load existing articles for dedup context + init engine
    const existing = await fetchExistingArticles(5000);
    const engine = new IngestionEngine({
      onStore: async (articles) => { void storeArticles(articles, { upsert: true }); },
      onLog: logIngestion,
    });
    engine.setExisting(existing);

    // Helper: null → undefined for the engine's loose input type
    const clean = (a: NormalizedArticle) => ({
      url: a.url,
      title: a.title,
      summary: a.summary ?? undefined,
      content: a.content ?? undefined,
      author: a.author ?? undefined,
      published_at: a.published_at ?? undefined,
      image_url: a.image_url ?? undefined,
      tags: a.tags,
    });

    // 2. Process all active RSS feeds
    const rssSources = SOURCES.filter((s) => s.active && s.type === 'rss');
    for (const source of rssSources) {
      const t0 = Date.now();
      try {
        const feed = await fetchRSS(source.url, 20000);
        if (feed.error || feed.items.length === 0) {
          results.push({ source_id: source.id, source_name: source.name, total: 0, new: 0, duplicates: 0, errors: 1, duration_ms: Date.now() - t0, error_details: feed.error ? [feed.error] : ['No items'] });
          continue;
        }
        const articles = feedItemsToNormalized(feed.items, source.id, source.name, 'rss');
        const input = articles.map(clean);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await engine.processArticles(input as any, source);
        result.duration_ms = Date.now() - t0;
        results.push(result);
      } catch (error) {
        results.push({ source_id: source.id, source_name: source.name, total: 0, new: 0, duplicates: 0, errors: 1, duration_ms: Date.now() - t0, error_details: [`Error: ${error instanceof Error ? error.message : error}`] });
      }
    }

    // 3. Social signals (HN + Reddit)
    try {
      const [hnTop, hnAI, reddit] = await Promise.all([
        fetchHackerNewsTop(),
        fetchHackerNewsAI(),
        fetchRedditAIPosts(),
      ]);

      const hnMerged = [...hnTop, ...hnAI.filter((p) => !hnTop.some((t) => t.id === p.id))];
      if (hnMerged.length > 0) {
        const hnArticles = hnMerged.map((p) => ({ url: p.external_url || p.url, title: p.title, summary: p.text ?? undefined, content: p.text ?? undefined, author: p.author, published_at: p.timestamp, tags: [...(p.tags || []), 'hackernews'] }));
        const hnSource: SourceConfig = { id: 'hackernews', name: 'Hacker News', type: 'social', url: 'https://news.ycombinator.com', site_url: 'https://news.ycombinator.com', tier: 2, language: 'en', category: 'community', active: true, topics: ['community', 'tech'] };
        const t0 = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await engine.processArticles(hnArticles as any, hnSource);
        result.duration_ms = Date.now() - t0;
        results.push(result);
      }

      if (reddit.length > 0) {
        const redditArticles = reddit.map((p) => ({ url: p.external_url || p.url, title: p.title, summary: p.text ?? undefined, content: p.text ?? undefined, author: p.author, published_at: p.timestamp, tags: [...(p.tags || []), 'reddit'] }));
        const redditSource: SourceConfig = { id: 'reddit-ai', name: 'Reddit AI', type: 'social', url: 'https://www.reddit.com/r/artificial/', site_url: 'https://www.reddit.com/r/artificial/', tier: 3, language: 'en', category: 'community', active: true, topics: ['community', 'ai'] };
        const t0 = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await engine.processArticles(redditArticles as any, redditSource);
        result.duration_ms = Date.now() - t0;
        results.push(result);
      }
    } catch (error) {
      results.push({ source_id: 'social-signals', source_name: 'Social Signals', total: 0, new: 0, duplicates: 0, errors: 1, duration_ms: 0, error_details: [`Social fetch error: ${error instanceof Error ? error.message : error}`] });
    }

    // 4. Summary
    const totalNew = results.reduce((s, r) => s + r.new, 0);
    const totalErrors = results.reduce((s, r) => s + r.errors, 0);

    return NextResponse.json({
      success: true,
      total_duration_ms: Date.now() - startTime,
      total_sources: results.length,
      total_new_articles: totalNew,
      total_errors: totalErrors,
      sources: results.map((r) => ({
        source: r.source_name,
        total: r.total,
        new: r.new,
        duplicates: r.duplicates,
        errors: r.errors,
        duration_ms: r.duration_ms,
        ...(r.error_details ? { errors_detail: r.error_details } : {}),
      })),
    });
  } catch (error) {
    console.error('[Cron Ingestion] Fatal:', error);
    return NextResponse.json({ success: false, total_duration_ms: Date.now() - startTime, error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
