import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get('since');
  if (!since) {
    return NextResponse.json({ error: 'Missing since parameter' }, { status: 400 });
  }

  try {
    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gt('published_at', since);

    if (error) throw error;

    // Get the most recent article timestamp for next poll
    const { data: latest } = await supabase
      .from('articles')
      .select('published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      count: data?.length || 0,
      latest_timestamp: latest?.published_at || since,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Live check error:', err);
    return NextResponse.json({ error: 'Failed to check for updates' }, { status: 500 });
  }
}
