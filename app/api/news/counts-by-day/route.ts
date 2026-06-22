import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CountsByDayQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parseResult = CountsByDayQuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { days } = parseResult.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use UTC midnight for consistency with DayFilterBar and published_at
  const utcNow = new Date();
  utcNow.setUTCHours(0, 0, 0, 0);
  const since = new Date(utcNow.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('articles')
    .select('published_at')
    .eq('status', 'published')
    .gte('published_at', since)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('API /api/news/counts-by-day error:', error);
    return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
  }

  const counts: Record<string, number> = {};

  for (const article of data || []) {
    const day = article.published_at.split('T')[0];
    counts[day] = (counts[day] || 0) + 1;
  }

  // Ensure all days in range are represented (even with 0 count)
  // Use UTC to match DayFilterBar and article published_at dates
  const utcToday = new Date();
  utcToday.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(utcToday);
    d.setUTCDate(d.getUTCDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    if (!(dayStr in counts)) {
      counts[dayStr] = 0;
    }
  }

  return NextResponse.json(
    { counts },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}