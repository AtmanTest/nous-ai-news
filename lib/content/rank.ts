import type { NormalizedArticle } from './types';

const TIER_SCORES: Record<number, number> = {
  1: 100,
  2: 85,
  3: 70,
  4: 50,
  5: 30,
};

// Time decay in hours
const FRESHNESS_HALF_LIFE = 24;
const TRENDING_HALF_LIFE = 6;

function calculateFreshness(hoursAgo: number): number {
  // Logarithmic decay: score drops by half every FRESHNESS_HALF_LIFE hours
  return Math.max(0, 100 * Math.pow(0.5, hoursAgo / FRESHNESS_HALF_LIFE));
}

function calculateTrendingFreshness(hoursAgo: number): number {
  // Faster decay for trending (stories need to be recent)
  return Math.max(0, 100 * Math.pow(0.5, hoursAgo / TRENDING_HALF_LIFE));
}

function calculateSourceAuthority(sourceType: string, tier: number): number {
  const typeBonus: Record<string, number> = {
    rss: 1.0,
    api: 1.1,
    newsapi: 0.9,
    social: 0.6,
  };

  return (TIER_SCORES[tier] || 50) * (typeBonus[sourceType] || 0.8);
}

function calculateContentQuality(article: NormalizedArticle): number {
  let score = 50;

  // Has content
  if (article.content && article.content.length > 200) score += 20;
  if (article.content && article.content.length > 1000) score += 10;

  // Has summary
  if (article.summary) score += 10;

  // Has author
  if (article.author) score += 5;

  // Has image
  if (article.image_url) score += 5;

  // Has tags
  if (article.tags.length > 0) score += 5;

  // Has entities
  if (article.entities.length > 0) score += 5;

  return Math.min(score, 100);
}

export function calculateScore(
  article: NormalizedArticle,
  tier: number = 3,
  socialMomentum: number = 0
): number {
  const now = new Date();
  const published = article.published_at ? new Date(article.published_at) : now;
  const hoursAgo = Math.max(0, (now.getTime() - published.getTime()) / (1000 * 60 * 60));

  const freshness = calculateFreshness(hoursAgo);
  const sourceAuthority = calculateSourceAuthority(article.source_type, tier);
  const contentQuality = calculateContentQuality(article);
  const entityRelevance = Math.min(article.entities.length * 5, 20);

  const score =
    freshness * 0.35 +
    sourceAuthority * 0.25 +
    contentQuality * 0.20 +
    socialMomentum * 0.10 +
    entityRelevance * 0.10;

  return Math.round(score * 10) / 10;
}

export function calculateTrendingScore(
  article: NormalizedArticle,
  tier: number = 3,
  socialMomentum: number = 0,
  viewCount: number = 0
): number {
  const now = new Date();
  const published = article.published_at ? new Date(article.published_at) : now;
  const hoursAgo = Math.max(0, (now.getTime() - published.getTime()) / (1000 * 60 * 60));

  const freshness = calculateTrendingFreshness(hoursAgo);
  const sourceAuthority = calculateSourceAuthority(article.source_type, tier);
  const contentQuality = calculateContentQuality(article);

  // Social momentum and views drive trending
  const viewFactor = Math.log2(viewCount + 1) * 5;
  const breakingBonus = article.is_breaking ? 20 : 0;

  const score =
    freshness * 0.20 +
    sourceAuthority * 0.10 +
    contentQuality * 0.10 +
    socialMomentum * 0.30 +
    viewFactor * 0.15 +
    breakingBonus * 0.15;

  return Math.round(score * 10) / 10;
}

export function rankArticles(articles: NormalizedArticle[]): NormalizedArticle[] {
  return articles.sort((a, b) => b.score - a.score);
}

export { calculateFreshness, calculateSourceAuthority, calculateContentQuality };
