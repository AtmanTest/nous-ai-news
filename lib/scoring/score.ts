import type { SocialMomentumResult } from './socialMomentum';

// ─── Weights ───────────────────────────────────────────────

const WEIGHTS = {
  freshnessDecay: 0.30,
  socialMomentum: 0.25,
  sourceAuthority: 0.20,
  modelSignal: 0.15,
  baseScore: 0.10,
} as const;

// ─── Types ─────────────────────────────────────────────────

export interface ScoreInput {
  /** The initial score assigned at ingestion (0–100) */
  baseScore: number;
  /** Hours since the article was published */
  hoursAgo: number;
  /** Pre-computed social momentum result */
  socialMomentum: SocialMomentumResult;
}

export interface ScoreResult {
  /** Final composite score (0–100) */
  score: number;
  /** Breakdown for debugging / transparency */
  breakdown: {
    baseContribution: number;
    freshnessContribution: number;
    socialContribution: number;
    sourceAuthorityContribution: number;
    modelSignalContribution: number;
  };
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Freshness bonus: scales the contribution based on how fresh an article is.
 * Uses the same half-life as socialMomentum (12h) but as a direct multiplier
 * on the base score rather than a separate normalised value.
 */
function freshnessMultiplier(hoursAgo: number): number {
  // Exponential decay: 1.0 at 0h, ~0.5 at 12h, ~0.25 at 24h
  return Math.max(0, Math.pow(0.5, hoursAgo / 12));
}

// ─── Main scoring function ─────────────────────────────────

/**
 * Calculate the live recalculated score for an article.
 *
 * Combines:
 *  - baseScore × baseWeight (initial ingestion score, small carry-over)
 *  - freshnessDecay × freshnessWeight (how recent the article is)
 *  - socialMomentum × socialWeight (bookmarks + velocity + model signal)
 *  - sourceAuthority × authorityWeight (tier × type)
 *  - modelSignal × modelWeight (entity count)
 *
 * All inputs are normalised to 0–100 before weighting.
 */
export function calculateLiveScore(input: ScoreInput): ScoreResult {
  const sm = input.socialMomentum;

  const baseContribution = input.baseScore * WEIGHTS.baseScore;
  const freshnessContribution =
    freshnessMultiplier(input.hoursAgo) * 100 * WEIGHTS.freshnessDecay;
  const socialContribution = sm.socialMomentum * WEIGHTS.socialMomentum;
  const sourceAuthorityContribution =
    sm.sourceAuthority * WEIGHTS.sourceAuthority;
  const modelSignalContribution = sm.modelSignal * WEIGHTS.modelSignal;

  const total =
    baseContribution +
    freshnessContribution +
    socialContribution +
    sourceAuthorityContribution +
    modelSignalContribution;

  return {
    score: Math.round(Math.min(100, Math.max(0, total)) * 10) / 10,
    breakdown: {
      baseContribution: Math.round(baseContribution * 10) / 10,
      freshnessContribution: Math.round(freshnessContribution * 10) / 10,
      socialContribution: Math.round(socialContribution * 10) / 10,
      sourceAuthorityContribution: Math.round(sourceAuthorityContribution * 10) / 10,
      modelSignalContribution: Math.round(modelSignalContribution * 10) / 10,
    },
  };
}

/**
 * Convenience: calculate trending score (more weight on social + velocity).
 * Used as an alternative score for the "trending" sort.
 */
export function calculateTrendingLiveScore(input: ScoreInput): ScoreResult {
  const TRENDING_WEIGHTS = {
    freshnessDecay: 0.15,
    socialMomentum: 0.40,
    sourceAuthority: 0.10,
    modelSignal: 0.10,
    baseScore: 0.05,
    velocity: 0.20,
  };

  const sm = input.socialMomentum;

  const baseContribution = input.baseScore * TRENDING_WEIGHTS.baseScore;
  const freshnessContribution =
    freshnessMultiplier(input.hoursAgo) * 100 * TRENDING_WEIGHTS.freshnessDecay;
  const socialContribution = sm.socialMomentum * TRENDING_WEIGHTS.socialMomentum;
  const sourceAuthorityContribution =
    sm.sourceAuthority * TRENDING_WEIGHTS.sourceAuthority;
  const modelSignalContribution = sm.modelSignal * TRENDING_WEIGHTS.modelSignal;
  const velocityContribution = sm.velocity * TRENDING_WEIGHTS.velocity;

  const total =
    baseContribution +
    freshnessContribution +
    socialContribution +
    sourceAuthorityContribution +
    modelSignalContribution +
    velocityContribution;

  return {
    score: Math.round(Math.min(100, Math.max(0, total)) * 10) / 10,
    breakdown: {
      baseContribution: Math.round(baseContribution * 10) / 10,
      freshnessContribution: Math.round(freshnessContribution * 10) / 10,
      socialContribution: Math.round(socialContribution * 10) / 10,
      sourceAuthorityContribution: Math.round(sourceAuthorityContribution * 10) / 10,
      modelSignalContribution: Math.round(modelSignalContribution * 10) / 10,
    },
  };
}
