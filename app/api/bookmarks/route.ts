import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '';

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ bookmarks: [] });

  let query = supabase
    .from('bookmarks')
    .select(`
      id, article_id, note, created_at,
      articles:article_id (
        id, title, summary, url, image_url, source_name,
        category, slug, score, published_at
      )
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error('[Bookmarks API] Error:', error.message);
    return NextResponse.json({ bookmarks: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data || [] }, {
    headers: {
      'Cache-Control': 'private, no-cache',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { userId, articleId, note } = body;

  if (!userId || !articleId) {
    return NextResponse.json({ error: 'userId and articleId required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, article_id: articleId, note: note || null });

  if (error) {
    const isDuplicate = error.message?.includes('duplicate key');
    if (isDuplicate) {
      return NextResponse.json({ success: true, message: 'Already bookmarked' });
    }
    console.error('[Bookmarks API] Insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const articleId = searchParams.get('articleId');

  if (!userId || !articleId) {
    return NextResponse.json({ error: 'userId and articleId required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .match({ user_id: userId, article_id: articleId });

  if (error) {
    console.error('[Bookmarks API] Delete error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
