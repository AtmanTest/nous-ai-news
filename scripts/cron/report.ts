/**
 * Generate and store shield run report
 */
import { createClient } from '@supabase/supabase-js';

interface ShieldRunResult {
  startedAt: string;
  endedAt: string;
  status: string;
  articlesAdded: number;
  articlesUpdated: number;
  duplicatesRemoved: number;
  brokenSources: number;
  signalsFetched: number;
  healthScore: number;
  errors: string[];
  appliedImprovements: string[];
}

export async function generateShieldReport(result: ShieldRunResult): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('[Report] No Supabase credentials — logging to stdout');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const { error } = await supabase.from('shield_runs').insert({
    run_type: 'full_cycle',
    started_at: result.startedAt,
    ended_at: result.endedAt,
    status: result.status,
    articles_added: result.articlesAdded,
    articles_updated: result.articlesUpdated,
    duplicates_removed: result.duplicatesRemoved,
    broken_sources: result.brokenSources,
    signals_fetched: result.signalsFetched,
    health_score: result.healthScore,
    errors: result.errors,
    suggested_improvements: result.appliedImprovements,
    report_json: JSON.stringify(result),
  });

  if (error) {
    console.error('[Report] DB error:', error.message);
  } else {
    console.log('[Report] ✅ Stored in shield_runs');
  }
}
