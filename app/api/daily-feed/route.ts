import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/daily-feed?cursor={date}&limit=50
 *
 * Returns articles grouped by date (day buckets), newest first.
 * - No tabs, just chronological by published_at DESC
 * - Cursor = date string (YYYY-MM-DD) of the LAST day fully loaded
 *   When cursor provided, returns days STRICTLY OLDER than that date
 * - Max 7 days back (configurable)
 * - Returns: { days: [{ date, label, articles: [] }], hasMore, nextCursor }
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 10), 200);
  const cursor = url.searchParams.get('cursor'); // YYYY-MM-DD of last loaded day
  const maxDays = 7;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Build the base query: published articles from last 7 days
  const sevenDaysAgo = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  let query = supabase
    .from('articles')
    .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .lte('published_at', now)  // Exclude future-dated articles
    .order('published_at', { ascending: false })
    .limit(limit * maxDays + 1); // fetch enough to cover all days

  const { data, error } = await query;

  if (error) {
    console.error('API /api/daily-feed error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  const allArticles = (data || []) as Array<{
    id: string;
    title: string;
    summary: string | null;
    image_url: string | null;
    source_name: string;
    category: string | null;
    tags: string[];
    published_at: string;
    score: number;
    is_breaking: boolean;
    content: string | null;
    language: string | null;
  }>;

  // Group by date (YYYY-MM-DD) in user's local time (UTC for now, can be improved)
  const groups = new Map<string, typeof allArticles>();
  for (const article of allArticles) {
    const date = article.published_at.split('T')[0]; // YYYY-MM-DD
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(article);
  }

  // Sort dates descending (newest first)
  const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

  // Apply cursor: only include days STRICTLY OLDER than cursor
  let startIdx = 0;
  if (cursor) {
    const cursorIdx = sortedDates.indexOf(cursor);
    if (cursorIdx >= 0) {
      startIdx = cursorIdx + 1; // skip cursor day and newer
    }
  }

  // Take up to maxDays from startIdx
  const selectedDates = sortedDates.slice(startIdx, startIdx + maxDays);

  // Build day objects with formatted labels
  const days = selectedDates.map((date) => {
    const articles = groups.get(date)!;
    // Sort articles within day: score desc, then published_at desc
    articles.sort((a, b) => b.score - a.score || b.published_at.localeCompare(a.published_at));

    // Format label: "Today", "Yesterday", "Monday June 8", etc.
    const articleDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (articleDate.getTime() === today.getTime()) {
      label = "Today";
    } else if (articleDate.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = articleDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }

    return { date, label, articles };
  });

  const hasMore = startIdx + selectedDates.length < sortedDates.length;
  const nextCursor = hasMore ? sortedDates[startIdx + selectedDates.length - 1] : null;

  return NextResponse.json({
    days,
    hasMore,
    nextCursor,
    totalDays: sortedDates.length,
    loadedDays: days.length,
  });
}