import { createClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────────────

export interface SocialMomentumInput {
  articleId: string;
  publishedAt: string;
  sourceTier: number;
  sourceType: 'rss' | 'api' | 'social' | 'newsapi';
  detectedModelCount: number;
  currentScore: number;
}

export interface SocialMomentumResult {
  /** Normalised 0–100 value representing social buzz */
  socialMomentum: number;
  /** Bookmark count for the article */
  bookmarkCount: number;
  /** Freshness decay multiplier (0–1) */
  freshnessDecay: number;
  /** Source authority score */
  sourceAuthority: number;
  /** Model signal contribution */
  modelSignal: number;
  /** Velocity (rate of score increase per hour) */
  velocity: number;
}

// ─── Helpers ───────────────────────────────────────────────

const TIER_SCORES: Record<number, number> = {
  1: 100,
  2: 85,
  3: 70,
  4: 50,
  5: 30,
};

const TYPE_BONUS: Record<string, number> = {
  rss: 1.0,
  api: 1.1,
  newsapi: 0.9,
  social: 0.6,
};

export function hoursSince(publishedAt: string): number {
  const now = Date.now();
  const pub = new Date(publishedAt).getTime();
  return Math.max(0, (now - pub) / (1000 * 60 * 60));
}

/**
 * Freshness decay: starts at 1.0, decays exponentially to 0.
 * Articles older than 72 hours have negligible freshness (≤0.125).
 */
export function calculateFreshnessDecay(hoursAgo: number): number {
  // Halves every 12 hours → after 72h it's ~0.016, capped at 0
  return Math.max(0, Math.pow(0.5, hoursAgo / 12));
}

export function calculateSourceAuthority(sourceType: string, tier: number): number {
  return (TIER_SCORES[tier] || 50) * (TYPE_BONUS[sourceType] || 0.8);
}

/**
 * Model signal: more detected models → more interest/relevance.
 * Capped at 100, diminishing returns after 5 models.
 */
export function calculateModelSignal(modelCount: number): number {
  return Math.min(100, modelCount * 20);
}

/**
 * Velocity: how fast the score grows relative to freshness decay.
 * Simulates a "rate of score increase" using current score / hours since publish.
 * Higher for new articles that already scored well.
 */
export function calculateVelocity(score: number, hoursAgo: number): number {
  if (hoursAgo < 0.5) return 0; // Too fresh to measure velocity
  // Normalise to 0–100: 10 points/hour → 100, maximum realistic velocity
  const raw = score / Math.max(hoursAgo, 0.5);
  return Math.min(100, Math.round(raw * 5));
}

// ─── Lazy Supabase client (for bookmark counting) ─────────

let _sb: ReturnType<typeof createClient> | null = null;

function getClient(): ReturnType<typeof createClient> | null {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

/**
 * Fetch bookmark count for a given article ID.
 * Returns 0 if DB is unavailable or article not found.
 */
async function fetchBookmarkCount(articleId: string): Promise<number> {
  const client = getClient();
  if (!client) return 0;
  try {
    const { count, error } = await client
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId);
    if (error) {
      console.warn(`[SocialMomentum] Bookmark count error for ${articleId}:`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Normalise bookmark count to a 0–100 scale.
 * Uses log scale so 1→20, 10→46, 100→66, 1000→86.
 */
export function normaliseBookmarks(count: number): number {
  return Math.min(100, Math.round(Math.log2(count + 1) * 10));
}

// ─── Main entry point ─────────────────────────────────────

/**
 * Calculate social momentum for a single article.
 *
 * Combines:
 *  - Bookmark count (real-time from DB)
 *  - Freshness decay (exponential, half-life 12h)
 *  - Source authority (tier × type bonus)
 *  - Model signal (number of detected model entities)
 *  - Velocity (score / hours since publish)
 */
export async function calculateSocialMomentum(
  input: SocialMomentumInput
): Promise<SocialMomentumResult> {
  const hoursAgo = hoursSince(input.publishedAt);

  const bookmarkCount = await fetchBookmarkCount(input.articleId);
  const freshnessDecay = calculateFreshnessDecay(hoursAgo);
  const sourceAuthority = calculateSourceAuthority(input.sourceType, input.sourceTier);
  const modelSignal = calculateModelSignal(input.detectedModelCount);
  const velocity = calculateVelocity(input.currentScore, hoursAgo);

  // Composite social momentum: weighted blend of all signals
  const bookmarkNormalised = normaliseBookmarks(bookmarkCount);

  const momentum =
    bookmarkNormalised * 0.35 +
    freshnessDecay * 0.25 +
    modelSignal * 0.20 +
    velocity * 0.10 +
    (sourceAuthority / 100) * 0.10;

  return {
    socialMomentum: Math.min(100, Math.round(momentum * 10) / 10),
    bookmarkCount,
    freshnessDecay: Math.round(freshnessDecay * 1000) / 1000,
    sourceAuthority: Math.round(sourceAuthority * 10) / 10,
    modelSignal,
    velocity,
  };
}
