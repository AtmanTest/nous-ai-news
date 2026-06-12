import { NextResponse } from 'next/server';
import { SOURCES } from '@/lib/content/sources';
import { fetchRSS, feedItemsToNormalized } from '@/lib/rss/parser';
import { createClient } from '@supabase/supabase-js';
import type { NormalizedArticle } from '@/lib/content/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Batch size for concurrent RSS fetches
const FETCH_CONCURRENCY = 20;

/**
 * Fast refresh: fetch 86 RSS sources concurrently, store new articles via upsert.
 * URL-level dedup via onConflict — no pre-fetch of existing articles needed.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const expectedKey = process.env.REFRESH_KEY || 'nous-ai-news-refresh';
  if (key !== expectedKey) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  let totalFetched = 0;
  let totalStored = 0;
  let totalErrors = 0;
  let totalSources = 0;

  // Init Supabase client directly (avoid imports of heavy engine classes)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, message: 'Missing Supabase credentials' }, { status: 500 });
  }
  const client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const rssSources = SOURCES.filter((s) => s.active && s.type === 'rss');
  totalSources = rssSources.length;

  // Process in batches of FETCH_CONCURRENCY concurrently
  for (let i = 0; i < rssSources.length; i += FETCH_CONCURRENCY) {
    const batch = rssSources.slice(i, i + FETCH_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (source) => {
        const feed = await fetchRSS(source.url, 5000);
        if (feed.error || feed.items.length === 0) return 0;
        const articles = feedItemsToNormalized(feed.items, source.id, source.name, 'rss');
        totalFetched += articles.length;

        // Store directly via upsert (URL-level dedup)
        if (articles.length > 0) {
          const dbRows = articles.map((a) => ({
            url: a.url,
            title: a.title,
            summary: a.summary || null,
            content: a.content || null,
            author: a.author || null,
            published_at: a.published_at || null,
            image_url: a.image_url || null,
            source_name: source.name,
            source_type: 'rss' as const,
            source_id: source.id,
            external_id: a.external_id || null,
            language: a.language || 'en',
            category: source.category || 'general',
            tags: a.tags || [],
            score: a.score || 0,
            is_breaking: a.is_breaking || false,
            status: 'published',
          }));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (client.from('articles') as any).upsert(dbRows, {
            onConflict: 'url',
            ignoreDuplicates: true,
          });
          if (!error) totalStored += articles.length;
        }
        return articles.length;
      })
    );

    for (const r of results) {
      if (r.status === 'rejected') totalErrors++;
    }
  }

  // Social signals (HN + Reddit) — lightweight
  try {
    const [hnRes, redditRes] = await Promise.allSettled([
      fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(5000) }),
      fetch('https://www.reddit.com/r/artificial/hot.json?limit=5', {
        headers: { 'User-Agent': 'NousAINews/1.0' },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (hnRes.status === 'fulfilled') {
      const ids = await hnRes.value.json() as number[];
      const topIds = ids.slice(0, 10);
      const stories = await Promise.all(
        topIds.map((id) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(3000) })
            .then((r) => r.json())
            .catch(() => null)
        )
      );
      const validStories = stories.filter(Boolean).filter((s: any) => s && s.title && s.url);
      if (validStories.length > 0) {
        const hnRows = validStories.map((s: any) => ({
          url: s.url,
          title: s.title,
          summary: s.text || null,
          content: null,
          author: s.by || 'Hacker News',
          published_at: new Date((s.time || 0) * 1000).toISOString(),
          source_name: 'Hacker News',
          source_type: 'social',
          source_id: 'hackernews',
          category: 'community',
          tags: ['hackernews', 'community'],
          score: s.score || 0,
          status: 'published',
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client.from('articles') as any).upsert(hnRows, {
          onConflict: 'url',
          ignoreDuplicates: true,
        });
        totalFetched += validStories.length;
        totalStored += validStories.length;
      }
    }
  } catch {
    totalErrors++;
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    ok: true,
    totalSources,
    totalFetched,
    totalStored,
    totalErrors,
    durationMs,
    message: `Refreshed ${totalSources} sources → ${totalFetched} articles fetched, ${totalStored} stored in ${(durationMs / 1000).toFixed(1)}s`,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: false,
    message: 'Use POST with ?key=... to trigger a refresh',
    docs: 'POST /api/refresh?key=your-key',
  });
}
