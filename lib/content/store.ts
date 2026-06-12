import type { NormalizedArticle, IngestionResult } from './types';
import { createClient } from '@supabase/supabase-js';

// Lazy-init Supabase client (avoids build errors without env vars)
let _supabaseClient: ReturnType<typeof createClient> | null = null;

function getClient(): ReturnType<typeof createClient> | null {
  if (_supabaseClient) return _supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[SupabaseStore] Missing credentials — storage disabled');
    return null;
  }

  _supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  return _supabaseClient;
}

export interface StoreOptions {
  batchSize?: number;
  upsert?: boolean;
}

/**
 * Store an array of normalized articles in Supabase.
 * Returns count of successfully stored articles.
 */
export async function storeArticles(
  articles: NormalizedArticle[],
  options: StoreOptions = {}
): Promise<{ stored: number; errors: number }> {
  const client = getClient();
  if (!client) return { stored: 0, errors: articles.length };

  const batchSize = options.batchSize || 50;
  let stored = 0;
  let errors = 0;

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const dbRows = batch.map((a) => ({
      url: a.url,
      title: a.title,
      summary: a.summary,
      content: a.content,
      author: a.author,
      published_at: a.published_at,
      image_url: a.image_url,
      source_name: a.source_name,
      source_type: a.source_type,
      source_id: a.source_id,
      external_id: a.external_id,
      language: a.language,
      category: a.category,
      tags: a.tags,
      entities: JSON.stringify(a.entities),
      score: a.score,
      is_breaking: a.is_breaking,
      status: 'published',
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sba = client.from('articles') as any;
    const { error, data: insertData } = await sba
      .upsert(dbRows, {
        onConflict: 'url',
        ignoreDuplicates: !options.upsert,
      })
      .select('id');

    if (error) {
      console.error('[SupabaseStore] Batch insert error:', error.message, JSON.stringify(error));
      errors += batch.length;
    } else if (insertData) {
      stored += batch.length;
    }
  }

  return { stored, errors };
}

/**
 * Fetch existing articles for deduplication context.
 */
export async function fetchExistingArticles(
  limit: number = 5000
): Promise<Array<{ url: string; title: string; content: string | null; id: string; url_hash: string }>> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('articles')
    .select('url, title, content, id, url_hash')
    .limit(limit);

  if (error) {
    console.error('[SupabaseStore] Fetch existing error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Log an ingestion result to the ingestion_log table.
 */
export async function logIngestion(result: IngestionResult): Promise<void> {
  const client = getClient();
  if (!client) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client.from('ingestion_logs') as any).insert({
    source_id: result.source_id,
    source_name: result.source_name,
    total: result.total,
    new_count: result.new,
    duplicates: result.duplicates,
    errors: result.errors,
    duration_ms: result.duration_ms,
    error_details: result.error_details ? JSON.stringify(result.error_details) : null,
    status: result.errors > 0 ? 'partial' : 'success',
  });
}


