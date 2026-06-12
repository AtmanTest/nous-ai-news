import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface PersonalizedArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source_name: string;
  source_type: string;
  source_tier: number | null;
  category: string | null;
  published_at: string;
  score: number;
  base_score: number | null;
  social_momentum: number | null;
  detected_models: string[] | null;
  image_url: string | null;
  slug: string;
  relevance_score: number;
  reason: string;
}

async function getUserEmbeddings(supabase: SupabaseClient, userId: string): Promise<number[] | null> {
  const { data } = await supabase
    .from('user_embeddings')
    .select('embedding')
    .eq('user_id', userId)
    .single();
  return data?.embedding ?? null;
}

async function getUserClickHistory(supabase: SupabaseClient, userId: string, limit = 50): Promise<string[]> {
  const { data } = await supabase
    .from('article_clicks')
    .select('article_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data?.map((d) => d.article_id) ?? [];
}

async function getUserBookmarks(supabase: SupabaseClient, userId: string, limit = 100): Promise<string[]> {
  const { data } = await supabase
    .from('bookmarks')
    .select('article_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data?.map((d) => d.article_id) ?? [];
}

async function getCategoryPreferences(supabase: SupabaseClient, userId: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('user_category_preferences')
    .select('category, weight')
    .eq('user_id', userId);
  return Object.fromEntries(data?.map((d) => [d.category, d.weight]) ?? []);
}

async function getCandidateArticles(
  supabase: SupabaseClient,
  options: {
    excludeIds: string[];
    limit: number;
    categories?: string[];
    hoursBack: number;
  }
): Promise<PersonalizedArticle[]> {
  const lookbackDate = new Date(Date.now() - options.hoursBack * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('articles')
    .select(
      'id, title, summary, url, source_name, source_type, source_tier, category, published_at, score, base_score, social_momentum, detected_models, image_url, slug'
    )
    .gte('published_at', lookbackDate)
    .order('published_at', { ascending: false })
    .limit(options.limit * 3);

  if (options.categories && options.categories.length > 0) {
    query = query.in('category', options.categories);
  }

  if (options.excludeIds.length > 0) {
    query = query.not('id', 'in', `(${options.excludeIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ForYou API] Error fetching candidates:', error.message);
    return [];
  }

  return (data ?? []) as PersonalizedArticle[];
}

function calculateRelevanceScore(
  article: PersonalizedArticle,
  context: {
    userEmbedding: number[] | null;
    clickedIds: Set<string>;
    bookmarkedIds: Set<string>;
    categoryPrefs: Record<string, number>;
    articleEmbeddings: Map<string, number[]>;
  }
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (article.category && context.categoryPrefs[article.category]) {
    score += context.categoryPrefs[article.category] * 0.3;
    reasons.push(`category:${article.category}`);
  }

  if (context.userEmbedding && context.articleEmbeddings.has(article.id)) {
    const articleEmb = context.articleEmbeddings.get(article.id)!;
    const similarity = cosineSimilarity(context.userEmbedding, articleEmb);
    if (similarity > 0.7) {
      score += similarity * 0.4;
      reasons.push(`similar_to_history:${(similarity * 100).toFixed(0)}%`);
    }
  }

  const hoursAgo = Math.max(0, (Date.now() - new Date(article.published_at).getTime()) / 3_600_000);
  if (hoursAgo < 24) {
    score += 0.1 * (1 - hoursAgo / 24);
    reasons.push('recent');
  }

  if (article.source_tier && article.source_tier <= 2) {
    score += 0.05 * (3 - article.source_tier);
    reasons.push('quality_source');
  }

  score += (article.score ?? 50) / 100 * 0.2;

  const reason = reasons.join(' + ') || 'discovery';
  return { score: Math.min(1, Math.max(0, score)), reason };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function fetchArticleEmbeddings(
  supabase: SupabaseClient,
  articleIds: string[]
): Promise<Map<string, number[]>> {
  if (articleIds.length === 0) return new Map();
  
  const { data } = await supabase
    .from('article_embeddings')
    .select('article_id, embedding')
    .in('article_id', articleIds);
  
  const map = new Map<string, number[]>();
  data?.forEach((d) => map.set(d.article_id, d.embedding));
  return map;
}

async function getTrendingFallback(
  supabase: SupabaseClient,
  limit: number,
  hoursBack: number
) {
  const lookbackDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('articles')
    .select(
      'id, title, summary, url, source_name, source_type, source_tier, category, published_at, score, base_score, social_momentum, detected_models, image_url, slug'
    )
    .gte('published_at', lookbackDate)
    .order('score', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return NextResponse.json({ articles: [], next_cursor: null, has_more: false, personalized: false });
  }

  return NextResponse.json({
    articles: data as PersonalizedArticle[],
    next_cursor: null,
    has_more: false,
    personalized: false,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const hoursBack = Math.min(parseInt(searchParams.get('hours_back') || '168'), 720);
  const cursor = searchParams.get('cursor');

  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return getTrendingFallback(supabase, limit, hoursBack);
  }

  try {
    const [userEmbedding, clickedIds, bookmarkedIds, categoryPrefs] = await Promise.all([
      getUserEmbeddings(supabase, user.id),
      getUserClickHistory(supabase, user.id),
      getUserBookmarks(supabase, user.id),
      getCategoryPreferences(supabase, user.id),
    ]);

    const clickedSet = new Set(clickedIds);
    const bookmarkedSet = new Set(bookmarkedIds);
    const excludeIds = [...clickedIds, ...bookmarkedIds];

    const categories = Object.keys(categoryPrefs).length > 0 ? Object.keys(categoryPrefs) : undefined;
    const candidates = await getCandidateArticles(supabase, {
      excludeIds,
      limit: 100,
      categories,
      hoursBack,
    });

    if (candidates.length === 0) {
      return getTrendingFallback(supabase, limit, hoursBack);
    }

    const candidateIds = candidates.map((a) => a.id);
    const articleEmbeddings = await fetchArticleEmbeddings(supabase, candidateIds);

    const ranked = candidates
      .map((article) => {
        const { score, reason } = calculateRelevanceScore(article, {
          userEmbedding,
          clickedIds: clickedSet,
          bookmarkedIds: bookmarkedSet,
          categoryPrefs,
          articleEmbeddings,
        });
        return { ...article, relevance_score: score, reason };
      })
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    const nextCursor = ranked.length === limit ? ranked[ranked.length - 1].id : null;

    await supabase.from('recommendation_logs').insert({
      user_id: user.id,
      article_ids: ranked.map((a) => a.id),
      algorithm: 'hybrid_v1',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      articles: ranked,
      next_cursor: nextCursor,
      has_more: nextCursor !== null,
      personalized: true,
    });
  } catch (error) {
    console.error('[ForYou API] Error:', error);
    return getTrendingFallback(supabase, limit, hoursBack);
  }
}