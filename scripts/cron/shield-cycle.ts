/**
 * AI News Shield — Main Cycle
 * Runs every 4 hours: fetch → normalize → dedupe → rank → enrich → publish → revalidate → health → report
 */
import { fetchAllSources } from './news-fetch';
import { fetchAllSocialSignals } from './signals-fetch';
import { batchDeduplicate } from '../../lib/content/dedupe';
import { calculateScore, calculateTrendingScore } from '../../lib/content/rank';
import { enrichArticle } from '../../lib/content/enrich';
import { storeArticles, fetchExistingArticles, logIngestion } from '../../lib/content/store';
import { checkSiteHealth } from './health-check';
import { revalidateSite } from './revalidate';
import { generateShieldReport } from './report';

interface ShieldRunResult {
  startedAt: string;
  endedAt: string;
  status: 'success' | 'partial' | 'failed';
  articlesAdded: number;
  articlesUpdated: number;
  duplicatesRemoved: number;
  brokenSources: number;
  signalsFetched: number;
  healthScore: number;
  errors: string[];
  appliedImprovements: string[];
}

async function main() {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const improvements: string[] = [];
  let articlesAdded = 0;
  let articlesUpdated = 0;
  let duplicatesRemoved = 0;
  let brokenSources = 0;
  let signalsFetched = 0;
  let healthScore = 0;

  console.log(`[Shield] ════════════════════════════════════`);
  console.log(`[Shield] 🛡️  Shield Cycle Started: ${startedAt}`);
  console.log(`[Shield] ════════════════════════════════════`);

  try {
    // Step 1: Fetch news
    console.log(`\n[Shield] 1/7 📡 Fetching news sources...`);
    const newsArticles = await fetchAllSources();
    console.log(`[Shield] Fetched ${newsArticles.length} raw articles`);

    // Step 2: Fetch social signals
    console.log(`\n[Shield] 2/7 🔥 Fetching social signals...`);
    const signals = await fetchAllSocialSignals();
    signalsFetched = signals.length;
    console.log(`[Shield] Fetched ${signals.length} social signals`);

    // Step 3: Normalize
    console.log(`\n[Shield] 3/7 🔄 Normalizing content...`);
    // (normalization happens inside processArticles)

    // Step 4: Deduplicate
    console.log(`\n[Shield] 4/7 🔍 Deduplicating...`);
    const existing = await fetchExistingArticles();
    const { newArticles, duplicates } = batchDeduplicate(newsArticles, existing);
    duplicatesRemoved = duplicates.length;
    console.log(`[Shield] ${newArticles.length} new, ${duplicates.length} duplicates`);

    // Step 5: Rank
    console.log(`\n[Shield] 5/7 📊 Ranking...`);
    const ranked = newArticles.map((a) => ({
      ...a,
      score: calculateScore(a, 2),
      trending_score: calculateTrendingScore(a, 2),
    }));

    // Step 6: Enrich
    console.log(`\n[Shield] 6/7 ✨ Enriching entities...`);
    const enriched = ranked.map(enrichArticle);

    // Step 7: Store
    console.log(`\n[Shield] 7/7 💾 Storing articles...`);
    const storeResult = await storeArticles(enriched);
    articlesAdded = storeResult.stored;

    // Revalidate cache
    console.log(`\n[Shield] Revalidating site cache...`);
    await revalidateSite();

    // Health check
    console.log(`\n[Shield] Running health check...`);
    const health = await checkSiteHealth();
    healthScore = health.score;

    if (health.errors.length > 0) {
      errors.push(...health.errors);
    }

    if (storeResult.errors > 0) {
      errors.push(`${storeResult.errors} store errors`);
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown shield error';
    errors.push(msg);
    console.error(`[Shield] ❌ Fatal: ${msg}`);
  }

  const endedAt = new Date().toISOString();
  const status = errors.length === 0 ? 'success' : errors.length > 3 ? 'failed' : 'partial';

  const result: ShieldRunResult = {
    startedAt,
    endedAt,
    status,
    articlesAdded,
    articlesUpdated,
    duplicatesRemoved,
    brokenSources,
    signalsFetched,
    healthScore,
    errors,
    appliedImprovements: improvements,
  };

  // Generate report
  await generateShieldReport(result);

  console.log(`\n[Shield] ════════════════════════════════════`);
  console.log(`[Shield] ✅ Done: ${articlesAdded} added, ${duplicatesRemoved} dup, ${errors.length} err`);
  console.log(`[Shield] Status: ${status} | Duration: ${(Date.now() - new Date(startedAt).getTime()) / 1000}s`);
  console.log(`[Shield] ════════════════════════════════════`);

  process.exit(errors.length > 3 ? 1 : 0);
}

main().catch((err) => {
  console.error('[Shield] Fatal:', err);
  process.exit(1);
});
