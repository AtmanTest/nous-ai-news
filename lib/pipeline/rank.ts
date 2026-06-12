import { calculateLiveScore, calculateTrendingLiveScore } from '@/lib/scoring/score';
import { calculateSocialMomentum } from '@/lib/scoring/socialMomentum';

// ─── Types ─────────────────────────────────────────────────

export interface ArticleForRescoring {
  id: string;
  title: string;
  summary: string | null;
  score: number;
  base_score: number | null;
  social_momentum: number | null;
  published_at: string | null;
  category: string | null;
  source_name: string;
  source_type?: string;
  source_tier?: number;
  detected_models?: string[] | null;
}

export interface RescoreResult {
  articleId: string;
  previousScore: number;
  newScore: number;
  trendingScore: number;
  socialMomentum: number;
  breakdown: Record<string, number>;
}

// ─── Pipeline ──────────────────────────────────────────────

const DEFAULT_TIER = 3;
const DEFAULT_TYPE = 'rss';

/**
 * Recalculate score for a single article using the live scoring pipeline.
 *
 * Decouples the initial insert score (base_score or score at ingest time) from
 * the dynamically recalculated score that includes social momentum, freshness
 * decay, and model signals.
 */
export async function rescoreArticle(
  article: ArticleForRescoring
): Promise<RescoreResult> {
  const now = new Date();
  const published = article.published_at
    ? new Date(article.published_at)
    : now;
  const hoursAgo = Math.max(
    0,
    (now.getTime() - published.getTime()) / (1000 * 60 * 60)
  );

  // Determine base score: use base_score if stored, otherwise use the current score
  const baseScore = article.base_score ?? article.score ?? 50;

  // Count detected models (from stored JSON array, e.g. ['gpt-4','claude'])
  const detectedModelCount = article.detected_models?.length ?? 0;

  // Calculate social momentum
  const socialMomentumResult = await calculateSocialMomentum({
    articleId: article.id,
    publishedAt: article.published_at ?? now.toISOString(),
    sourceTier: article.source_tier ?? DEFAULT_TIER,
    sourceType: (article.source_type as 'rss' | 'api' | 'social' | 'newsapi') ?? DEFAULT_TYPE,
    detectedModelCount,
    currentScore: article.score,
  });

  // Calculate live composite score
  const scoreResult = calculateLiveScore({
    baseScore,
    hoursAgo,
    socialMomentum: socialMomentumResult,
  });

  // Calculate trending score
  const trendingResult = calculateTrendingLiveScore({
    baseScore,
    hoursAgo,
    socialMomentum: socialMomentumResult,
  });

  return {
    articleId: article.id,
    previousScore: article.score,
    newScore: scoreResult.score,
    trendingScore: trendingResult.score,
    socialMomentum: socialMomentumResult.socialMomentum,
    breakdown: {
      ...scoreResult.breakdown,
      trending_total: trendingResult.score,
      bookmarkCount: socialMomentumResult.bookmarkCount,
      freshnessDecay: socialMomentumResult.freshnessDecay,
      sourceAuthority: socialMomentumResult.sourceAuthority,
      modelSignal: socialMomentumResult.modelSignal,
      velocity: socialMomentumResult.velocity,
    },
  };
}

/**
 * Batch rescore multiple articles.
 */
export async function rescoreArticles(
  articles: ArticleForRescoring[]
): Promise<RescoreResult[]> {
  const results: RescoreResult[] = [];
  for (const article of articles) {
    try {
      const result = await rescoreArticle(article);
      results.push(result);
    } catch (error) {
      console.error(`[RescorePipeline] Error rescoring ${article.id}:`, error);
      results.push({
        articleId: article.id,
        previousScore: article.score,
        newScore: article.score,
        trendingScore: article.score,
        socialMomentum: 0,
        breakdown: { error: 1 },
      });
    }
  }
  return results;
}
