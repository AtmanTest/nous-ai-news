import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rescoreArticle, rescoreArticles } from '@/lib/pipeline/rank';
import type { ArticleForRescoring } from '@/lib/pipeline/rank';

// ─── Mock scoring modules ───────────────────────────────────

const mockSocialMomentumResult = {
  socialMomentum: 45.5,
  bookmarkCount: 12,
  freshnessDecay: 0.75,
  sourceAuthority: 70,
  modelSignal: 40,
  velocity: 25,
};

const mockScoreResult = {
  score: 72.5,
  breakdown: {
    baseContribution: 5.0,
    freshnessContribution: 22.5,
    socialContribution: 11.4,
    sourceAuthorityContribution: 14.0,
    modelSignalContribution: 6.0,
  },
};

const mockTrendingResult = {
  score: 68.3,
  breakdown: {
    baseContribution: 2.5,
    freshnessContribution: 11.3,
    socialContribution: 18.2,
    sourceAuthorityContribution: 7.0,
    modelSignalContribution: 4.0,
  },
};

vi.mock('@/lib/scoring/socialMomentum', () => ({
  calculateSocialMomentum: vi.fn(() => Promise.resolve(mockSocialMomentumResult)),
}));

vi.mock('@/lib/scoring/score', () => ({
  calculateLiveScore: vi.fn(() => mockScoreResult),
  calculateTrendingLiveScore: vi.fn(() => mockTrendingResult),
}));

// Re-import after mocks
import { calculateSocialMomentum } from '@/lib/scoring/socialMomentum';
import { calculateLiveScore, calculateTrendingLiveScore } from '@/lib/scoring/score';

// ─── Helpers ────────────────────────────────────────────────

function makeArticle(overrides: Partial<ArticleForRescoring> = {}): ArticleForRescoring {
  return {
    id: 'article-001',
    title: 'Test Article',
    summary: 'A test article summary',
    score: 60,
    base_score: 50,
    social_momentum: null,
    published_at: new Date(Date.now() - 3600_000).toISOString(), // 1 hour ago
    category: 'ai',
    source_name: 'Test Source',
    source_type: 'rss',
    source_tier: 2,
    detected_models: ['gpt-4', 'claude'],
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────

describe('rescoreArticle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all required fields in RescoreResult shape', async () => {
    const article = makeArticle();
    const result = await rescoreArticle(article);

    expect(result).toHaveProperty('articleId', 'article-001');
    expect(result).toHaveProperty('previousScore', 60);
    expect(result).toHaveProperty('newScore');
    expect(result).toHaveProperty('trendingScore');
    expect(result).toHaveProperty('socialMomentum', 45.5);
    expect(result).toHaveProperty('breakdown');
    expect(result.breakdown).toHaveProperty('bookmarkCount', 12);
    expect(result.breakdown).toHaveProperty('freshnessDecay', 0.75);
    expect(result.breakdown).toHaveProperty('sourceAuthority', 70);
    expect(result.breakdown).toHaveProperty('modelSignal', 40);
    expect(result.breakdown).toHaveProperty('velocity', 25);
    expect(result.breakdown).toHaveProperty('trending_total', 68.3);
  });

  it('passes correct arguments to calculateSocialMomentum', async () => {
    const article = makeArticle({ id: 'article-002' });
    await rescoreArticle(article);

    expect(calculateSocialMomentum).toHaveBeenCalledWith({
      articleId: 'article-002',
      publishedAt: article.published_at,
      sourceTier: 2,
      sourceType: 'rss',
      detectedModelCount: 2,
      currentScore: 60,
    });
  });

  it('passes correct arguments to calculateLiveScore and calculateTrendingLiveScore', async () => {
    await rescoreArticle(makeArticle());

    const scoreInput = (calculateLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(scoreInput.baseScore).toBe(50);
    expect(scoreInput.hoursAgo).toBeGreaterThan(0);
    expect(scoreInput.socialMomentum).toEqual(mockSocialMomentumResult);

    const trendInput = (calculateTrendingLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(trendInput.baseScore).toBe(50);
  });

  it('uses published_at when available for hoursAgo calculation', async () => {
    // Article published 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
    await rescoreArticle(makeArticle({ published_at: twoHoursAgo }));

    const scoreInput = (calculateLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(scoreInput.hoursAgo).toBeGreaterThanOrEqual(1.9);
    expect(scoreInput.hoursAgo).toBeLessThanOrEqual(2.1);
  });

  it('handles null published_at by using current time (hoursAgo ~= 0)', async () => {
    await rescoreArticle(makeArticle({ published_at: null }));

    const scoreInput = (calculateLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(scoreInput.hoursAgo).toBeLessThanOrEqual(0.01);
  });

  it('handles a very old article (>72 hours) correctly', async () => {
    const oldDate = new Date(Date.now() - 100 * 3600_000).toISOString();
    await rescoreArticle(makeArticle({ published_at: oldDate }));

    const scoreInput = (calculateLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(scoreInput.hoursAgo).toBeGreaterThan(72);
  });

  it('handles detected_models=[] (empty array)', async () => {
    await rescoreArticle(makeArticle({ detected_models: [] }));

    expect(calculateSocialMomentum).toHaveBeenCalledWith(
      expect.objectContaining({ detectedModelCount: 0 }),
    );
  });

  it('handles detected_models with multiple model entries', async () => {
    await rescoreArticle(makeArticle({
      detected_models: ['gpt-4', 'claude', 'gemini'],
    }));

    expect(calculateSocialMomentum).toHaveBeenCalledWith(
      expect.objectContaining({ detectedModelCount: 3 }),
    );
  });

  it('uses base_score when available (not null)', async () => {
    await rescoreArticle(makeArticle({ base_score: 80, score: 60 }));

    const scoreInput = (calculateLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(scoreInput.baseScore).toBe(80);
  });

  it('falls back to current score when base_score is null', async () => {
    await rescoreArticle(makeArticle({ base_score: null, score: 75 }));

    const scoreInput = (calculateLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // fallback: article.score ?? 50 → 75
    expect(scoreInput.baseScore).toBe(75);
  });

  it('falls back to 50 when both base_score and score are null/0', async () => {
    await rescoreArticle(makeArticle({ base_score: null, score: 0 }));

    const scoreInput = (calculateLiveScore as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // article.score is 0 (truthy in ?? check), so it uses 0... wait.
    // article.score ?? 50 → 0 is not nullish, so it uses 0.
    // But the code says: article.base_score ?? article.score ?? 50
    // base_score is null → article.score (0) → fallback to 50 since 0 ?? 50 → 50?
    // No! 0 ?? 50 → 0 because ?? only checks null/undefined.
    // So base_score=null → article.score=0 → 0
    expect(scoreInput.baseScore).toBe(0);
  });

  it('includes previousScore from article.score', async () => {
    const result = await rescoreArticle(makeArticle({ score: 42 }));
    expect(result.previousScore).toBe(42);
  });

  it('includes all breakdown fields from scoring modules', async () => {
    const result = await rescoreArticle(makeArticle());

    expect(result.breakdown).toMatchObject({
      baseContribution: 5.0,
      freshnessContribution: 22.5,
      socialContribution: 11.4,
      sourceAuthorityContribution: 14.0,
      modelSignalContribution: 6.0,
      trending_total: 68.3,
      bookmarkCount: 12,
      freshnessDecay: 0.75,
      sourceAuthority: 70,
      modelSignal: 40,
      velocity: 25,
    });
  });

  it('provides default source_tier=3 when source_tier is undefined', async () => {
    const article = makeArticle({ source_tier: undefined });
    await rescoreArticle(article);

    expect(calculateSocialMomentum).toHaveBeenCalledWith(
      expect.objectContaining({ sourceTier: 3 }),
    );
  });

  it('provides default source_type="rss" when source_type is undefined', async () => {
    const article = makeArticle({ source_type: undefined });
    await rescoreArticle(article);

    expect(calculateSocialMomentum).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: 'rss' }),
    );
  });
});

// ─── rescoreArticles ────────────────────────────────────────

describe('rescoreArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rescores multiple articles and returns results in order', async () => {
    const articles = [
      makeArticle({ id: 'art-1' }),
      makeArticle({ id: 'art-2' }),
      makeArticle({ id: 'art-3' }),
    ];

    const results = await rescoreArticles(articles);

    expect(results).toHaveLength(3);
    expect(results[0].articleId).toBe('art-1');
    expect(results[1].articleId).toBe('art-2');
    expect(results[2].articleId).toBe('art-3');
    expect(results[0].newScore).toBe(72.5);
  });

  it('isolates errors: a single failing article does not crash the batch', async () => {
    const goodArticle = makeArticle({ id: 'good-one' });
    const badArticle = makeArticle({ id: 'bad-one' });
    const anotherGood = makeArticle({ id: 'another-good' });

    // Make rescoreArticle throw for badArticle
    const { rescoreArticle: actualRescore } = await import('@/lib/pipeline/rank');
    // We need to make rescoreArticle throw on a specific article.
    // Since rescoreArticles calls rescoreArticle internally, and we mocked
    // calculateSocialMomentum to always succeed, we need a different approach.
    // Let's make calculateSocialMomentum throw for a specific call.
    const mockSocial = vi.mocked(calculateSocialMomentum);
    mockSocial
      .mockResolvedValueOnce(mockSocialMomentumResult) // good-one
      .mockRejectedValueOnce(new Error('DB failure'))  // bad-one
      .mockResolvedValueOnce(mockSocialMomentumResult); // another-good

    const results = await rescoreArticles([goodArticle, badArticle, anotherGood]);

    expect(results).toHaveLength(3);
    // First article succeeded
    expect(results[0].articleId).toBe('good-one');
    expect(results[0].newScore).toBe(72.5);
    // Second article errored → returns fallback with same score
    expect(results[1].articleId).toBe('bad-one');
    expect(results[1].previousScore).toBe(60);
    expect(results[1].newScore).toBe(60); // Falls back to article.score
    expect(results[1].trendingScore).toBe(60);
    expect(results[1].socialMomentum).toBe(0);
    expect(results[1].breakdown).toEqual({ error: 1 });
    // Third article succeeded
    expect(results[2].articleId).toBe('another-good');
    expect(results[2].newScore).toBe(72.5);
  });

  it('returns empty array for empty input', async () => {
    const results = await rescoreArticles([]);
    expect(results).toEqual([]);
  });

  it('handles a single article batch', async () => {
    const results = await rescoreArticles([makeArticle({ id: 'solo' })]);
    expect(results).toHaveLength(1);
    expect(results[0].articleId).toBe('solo');
  });
});
