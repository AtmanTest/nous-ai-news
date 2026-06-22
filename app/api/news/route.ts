import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cacheManager } from '@/lib/cache/cacheManager';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NewsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(12),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tab: z.enum(['latest', 'trending', 'for-you']).default('latest'),
});

/**
 * GET /api/news?tab=latest|trending|for-you&cursor={published_at}&limit=20&date=YYYY-MM-DD
 *
 * Returns paginated published articles based on the active tab.
 * - latest: ordered by published_at DESC
 * - trending: ordered by score DESC (score >= 30) — cached for 5 min
 * - for-you: same as latest for guests, or optionally personalized
 *
 * Use cursor-based pagination: pass the `published_at` of the last article
 * you received as `cursor` to get the next page.
 *
 * Optional `date` filter: restrict results to articles published on a specific day (YYYY-MM-DD).
 * When date is provided, cursor-based pagination works within that day only.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parseResult = NewsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { limit, cursor, tab, date } = parseResult.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Build base query with common filters
  const baseQuery = (q: ReturnType<typeof supabase.from>) => {
    let query = q
      .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
      .eq('status', 'published');

    // Apply date filter if provided
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z').toISOString();
      const endOfDay = new Date(date + 'T23:59:59.999Z').toISOString();
      query = query.gte('published_at', startOfDay).lte('published_at', endOfDay);
    } else {
      // Default: freshness filter < 7 days
      query = query.gte('published_at', sevenDaysAgo);
    }

    return query;
  };

  // ─── Trending: use cache with memory fallback ──────────────────────────
  if (tab === 'trending' && !cursor) {
    try {
      const result = await cacheManager.fetch(
        'trending',
        ['page-1'],
        async () => {
          const query = baseQuery(supabase.from('articles'))
            .gte('score', 30)
            .order('score', { ascending: false })
            .order('published_at', { ascending: false })
            .limit(limit + 1);

          const { data, error } = await query;

          if (error) throw error;

          const articles = (data || []).slice(0, limit);
          const hasMore = (data || []).length > limit;
          const last = articles[articles.length - 1];
          const nextCursor = last ? `${last.score}_${last.published_at}` : null;

          return { articles, hasMore, nextCursor };
        },
        { namespace: 'trending', ttlMs: 5 * 60 * 1000, serveStale: true },
      );

      return NextResponse.json({
        ...result.data,
        cached: result.cached,
        stale: result.stale || undefined,
        source: result.source,
      });
    } catch (err) {
      console.error(`API /api/news error (tab=${tab}):`, err);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
  }

  // ─── Latest / For You / Trending with cursor: no caching ───────────────
  let query = baseQuery(supabase.from('articles')).limit(limit + 1);

  if (tab === 'trending') {
    query = query
      .gte('score', 30)
      .order('score', { ascending: false })
      .order('published_at', { ascending: false });

    if (cursor) {
      const [scoreStr, ts] = cursor.split('_');
      const scoreVal = parseFloat(scoreStr);
      if (!isNaN(scoreVal) && ts) {
        query = query.or(`and(score.lt.${scoreVal}),and(score.eq.${scoreVal},published_at.lt.${ts})`);
      }
    }
  } else {
    query = query
      .order('published_at', { ascending: false })
      .order('id', { ascending: false });

    if (cursor) {
      query = query.lt('published_at', cursor);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error(`API /api/news error (tab=${tab}):`, error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  const articles = (data || []).slice(0, limit);
  const hasMore = (data || []).length > limit;

  let nextCursor: string | null = null;
  if (articles.length > 0) {
    const last = articles[articles.length - 1];
    nextCursor = tab === 'trending'
      ? `${last.score}_${last.published_at}`
      : last.published_at;
  }

  return NextResponse.json({
    articles,
    hasMore,
    nextCursor,
  });
}
