import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rescoreArticles } from '@/lib/pipeline/rank';
import type { ArticleForRescoring } from '@/lib/pipeline/rank';

// ─── Config ────────────────────────────────────────────────

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOOKBACK_HOURS = 72;
const BATCH_SIZE = 100;

// ─── Lazy Supabase client ─────────────────────────────────

let _sb: ReturnType<typeof createClient> | null = null;

function getClient(): ReturnType<typeof createClient> | null {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

// ─── Route Handlers ────────────────────────────────────────

/**
 * GET: Health check / current config info
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'POST to trigger article rescore',
    lookback_hours: LOOKBACK_HOURS,
    batch_size: BATCH_SIZE,
  });
}

/**
 * POST: Trigger full rescore of recent articles.
 * Protected by Vercel Cron secret (set CRON_SECRET env var).
 */
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const client = getClient();

  if (!client) {
    return NextResponse.json(
      { success: false, error: 'Supabase client not configured' },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch articles from last LOOKBACK_HOURS
    const lookbackDate = new Date(
      Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: articles, error: fetchError } = await client
      .from('articles')
      .select(
        'id, title, summary, score, base_score, social_momentum, published_at, category, source_name, source_type, detected_models'
      )
      .gte('published_at', lookbackDate)
      .order('published_at', { ascending: false })
      .limit(5000);

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        total_articles: 0,
        total_updated: 0,
        total_duration_ms: Date.now() - startTime,
        message: 'No articles to rescore',
      });
    }

    // 2. Map to pipeline input type
    const articlesToRescore: ArticleForRescoring[] = articles.map(
      (a: Record<string, unknown>) => ({
        id: a.id as string,
        title: (a.title as string) ?? '',
        summary: (a.summary as string) ?? null,
        score: (a.score as number) ?? 0,
        base_score: (a.base_score as number | null) ?? null,
        social_momentum: (a.social_momentum as number | null) ?? null,
        published_at: (a.published_at as string) ?? null,
        category: (a.category as string) ?? null,
        source_name: (a.source_name as string) ?? '',
        source_type: (a.source_type as string) ?? 'rss',
        detected_models: (a.detected_models as string[] | null) ?? null,
      })
    );

    // 3. Rescore in batches
    const allResults: Array<{
      articleId: string;
      newScore: number;
      trendingScore: number;
      socialMomentum: number;
    }> = [];

    for (let i = 0; i < articlesToRescore.length; i += BATCH_SIZE) {
      const batch = articlesToRescore.slice(i, i + BATCH_SIZE);
      const results = await rescoreArticles(batch);

      // Build update payloads
      const updates = results.map((r) => ({
        id: r.articleId,
        score: r.newScore,
        social_momentum: r.socialMomentum,
        updated_at: new Date().toISOString(),
      }));

      // Batch update in Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sba = client.from('articles') as any;
      const { error: updateError } = await sba
        .upsert(updates as any[], { onConflict: 'id' });

      if (updateError) {
        console.error(
          `[Rescore Cron] Batch update error (batch ${i}):`,
          updateError.message
        );
      }

      allResults.push(
        ...results.map((r) => ({
          articleId: r.articleId,
          newScore: r.newScore,
          trendingScore: r.trendingScore,
          socialMomentum: r.socialMomentum,
        }))
      );

      // Small delay between batches to avoid overwhelming the DB
      if (i + BATCH_SIZE < articlesToRescore.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // 4. Summary stats
    const avgScoreChange =
      allResults.reduce(
        (sum, r) => sum + r.newScore,
        0
      ) / allResults.length;

    const totalUpdated = allResults.length;

    return NextResponse.json({
      success: true,
      total_articles: articles.length,
      total_updated: totalUpdated,
      average_new_score: Math.round(avgScoreChange * 10) / 10,
      lookback_hours: LOOKBACK_HOURS,
      total_duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[Rescore Cron] Fatal:', error);
    return NextResponse.json(
      {
        success: false,
        total_duration_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}
