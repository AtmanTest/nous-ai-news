import type { NormalizedArticle, DedupResult } from './types';

interface MinHashSignature {
  sig: number[];
  size: number;
}

// Simple MinHash implementation for content fingerprinting
const HASH_FUNCTIONS = 100;

function hashShingle(shingle: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < shingle.length; i++) {
    hash = ((hash << 5) - hash + shingle.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getShingles(text: string, size: number = 3): Set<string> {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const shingles = new Set<string>();

  for (let i = 0; i <= words.length - size; i++) {
    shingles.add(words.slice(i, i + size).join(' '));
  }

  return shingles;
}

function computeSignature(text: string): MinHashSignature {
  const shingles = getShingles(text);
  const sig: number[] = [];

  for (let i = 0; i < HASH_FUNCTIONS; i++) {
    let minHash = Infinity;
    const shingleArray = Array.from(shingles);
    for (const shingle of shingleArray) {
      const hash = hashShingle(shingle, i * 31 + 7);
      if (hash < minHash) minHash = hash;
    }
    sig.push(minHash === Infinity ? 0 : minHash);
  }

  return { sig, size: shingles.size };
}

function estimateSimilarity(a: MinHashSignature, b: MinHashSignature): number {
  if (a.sig.length !== b.sig.length) return 0;
  let matches = 0;
  for (let i = 0; i < a.sig.length; i++) {
    if (a.sig[i] === b.sig[i]) matches++;
  }
  return matches / a.sig.length;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

function titleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim();
  const t2 = title2.toLowerCase().trim();
  if (t1 === t2) return 1.0;

  const maxLen = Math.max(t1.length, t2.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(t1, t2);
  return 1 - dist / maxLen;
}

function urlHash(url: string): string {
  // Simple hash for URL matching
  const cleanUrl = url.split('?')[0].split('#')[0].replace(/\/$/, '');
  let hash = 0;
  for (let i = 0; i < cleanUrl.length; i++) {
    const char = cleanUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// In-memory cache of existing articles (in production, this queries Supabase)
interface ExistingArticle {
  url: string;
  title: string;
  content: string | null;
  id: string;
  url_hash: string;
}

export function checkDeduplicate(
  article: NormalizedArticle,
  existingArticles: ExistingArticle[]
): DedupResult {
  const articleUrlHash = urlHash(article.url);

  // Stage 1: URL exact match
  for (const existing of existingArticles) {
    if (existing.url_hash === articleUrlHash || existing.url === article.url) {
      return {
        is_duplicate: true,
        match_type: 'exact_url',
        existing_id: existing.id,
        similarity: 1.0,
      };
    }
  }

  // Stage 2: Title similarity
  for (const existing of existingArticles) {
    const similarity = titleSimilarity(article.title, existing.title);
    if (similarity > 0.85) {
      return {
        is_duplicate: true,
        match_type: 'title_similar',
        existing_id: existing.id,
        similarity,
      };
    }
  }

  // Stage 3: Content fingerprint (MinHash)
  if (article.summary || article.content) {
    const articleText = (article.summary || '') + ' ' + (article.content || '');
    if (articleText.length > 100) {
      const articleSig = computeSignature(articleText);

      for (const existing of existingArticles) {
        const existingText = (existing.content || existing.title);
        if (existingText.length > 100) {
          const existingSig = computeSignature(existingText);
          const similarity = estimateSimilarity(articleSig, existingSig);

          if (similarity > 0.8) {
            return {
              is_duplicate: true,
              match_type: 'content_fingerprint',
              existing_id: existing.id,
              similarity,
            };
          }
        }
      }
    }
  }

  return { is_duplicate: false };
}

export function batchDeduplicate(
  articles: NormalizedArticle[],
  existingArticles: ExistingArticle[]
): { newArticles: NormalizedArticle[]; duplicates: { article: NormalizedArticle; reason: DedupResult }[] } {
  const newArticles: NormalizedArticle[] = [];
  const duplicates: { article: NormalizedArticle; reason: DedupResult }[] = [];

  for (const article of articles) {
    const result = checkDeduplicate(article, existingArticles);
    if (result.is_duplicate) {
      duplicates.push({ article, reason: result });
    } else {
      newArticles.push(article);
    }
  }

  return { newArticles, duplicates };
}

export { titleSimilarity, urlHash };
