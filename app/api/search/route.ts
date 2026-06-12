import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; // 1 minute cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const source = searchParams.get('source') || '';
  const language = searchParams.get('language') || '';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';
  const sort = searchParams.get('sort') || 'score';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const offset = (page - 1) * limit;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ articles: [], total: 0, error: 'DB not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  let query = supabase
    .from('articles')
    .select('id, title, summary, url, image_url, source_name, category, tags, score, published_at, language, slug', { count: 'exact' })
    .eq('status', 'published');

  // Full-text search
  if (q) {
    query = query.textSearch('search_vector', q, {
      type: 'websearch',
      config: 'english',
    });
  }

  // Filters
  if (category) {
    if (category === 'all') {
      // no filter
    } else if (category.includes(',')) {
      query = query.in('category', category.split(','));
    } else {
      query = query.eq('category', category);
    }
  }

  if (source) {
    query = query.eq('source_name', source);
  }

  if (language) {
    query = query.eq('language', language);
  }

  if (dateFrom) {
    query = query.gte('published_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('published_at', dateTo);
  }

  // Sorting
  switch (sort) {
    case 'newest':
      query = query.order('published_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('published_at', { ascending: true });
      break;
    case 'trending':
      query = query.order('trending_score', { ascending: false });
      break;
    case 'title':
      query = query.order('title', { ascending: true });
      break;
    case 'score':
    default:
      query = query.order('score', { ascending: false });
      break;
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Search API] Error:', error.message);
    return NextResponse.json({ articles: [], total: 0, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: data || [],
    total: count || 0,
    page,
    limit,
    pages: Math.ceil((count || 0) / limit),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
