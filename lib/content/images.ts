/**
 * Image fallback pipeline: cascade strategy to find article images.
 *
 * Strategy:
 * 1. RSS native image (already extracted by parser)
 * 2. Open Graph og:image via HTML meta extraction
 * 3. Twitter image via HTML meta extraction
 * 4. Fallback by category/topic (local themed fallback)
 */

interface ImageResult {
  url: string | null;
  source: 'rss' | 'og' | 'twitter' | 'fallback';
}

// Per-category fallback gradients (CSS-friendly descriptions)
const CATEGORY_FALLBACKS: Record<string, string> = {
  models: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  research: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80',
  business: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
  policy: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  'open-source': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
  startups: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
  hardware: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  agents: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
};

const THEME_COLORS: Record<string, { bg: string; accent: string }> = {
  models: { bg: 'from-purple-900/40', accent: 'to-purple-700/20' },
  research: { bg: 'from-blue-900/40', accent: 'to-blue-700/20' },
  business: { bg: 'from-emerald-900/40', accent: 'to-emerald-700/20' },
  policy: { bg: 'from-amber-900/40', accent: 'to-amber-700/20' },
  'open-source': { bg: 'from-cyan-900/40', accent: 'to-cyan-700/20' },
  startups: { bg: 'from-pink-900/40', accent: 'to-pink-700/20' },
  hardware: { bg: 'from-orange-900/40', accent: 'to-orange-700/20' },
  agents: { bg: 'from-violet-900/40', accent: 'to-violet-700/20' },
};

/**
 * Extract Open Graph image from a URL by fetching and parsing HTML.
 */
export async function extractOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NousAINews/1.0 (image extraction bot)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const html = await response.text();

    // Try og:image first
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*\/?>/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*\/?>/i);
    if (ogMatch) return resolveUrl(ogMatch[1], url);

    // Try twitter:image
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*\/?>/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*\/?>/i);
    if (twMatch) return resolveUrl(twMatch[1], url);

    return null;
  } catch {
    return null;
  }
}

/**
 * Try to extract OG image from multiple articles in batch.
 * Returns a Map of article URL -> image URL.
 */
export async function batchExtractOgImages(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in parallel with a concurrency limit
  const concurrency = 5;
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (url) => {
      const image = await extractOgImage(url);
      if (image) results.set(url, image);
    });
    await Promise.all(promises);
  }

  return results;
}

/**
 * Get the best available image URL using the cascade strategy.
 */
export function getImageCascade(
  rssImage: string | null | undefined,
  ogImage: string | null | undefined,
  category?: string | null,
  title?: string | null,
): ImageResult {
  // Stage 1: RSS native image
  if (rssImage) {
    return { url: rssImage, source: 'rss' };
  }

  // Stage 2: OG image (pre-extracted)
  if (ogImage) {
    return { url: ogImage, source: 'og' };
  }

  // Stage 3: Category fallback
  if (category && CATEGORY_FALLBACKS[category]) {
    return { url: CATEGORY_FALLBACKS[category], source: 'fallback' };
  }

  // Stage 4: Generic fallback based on title keywords
  const fallbackKey = guessCategoryFromTitle(title || '') || 'general';
  const fallbackUrl = CATEGORY_FALLBACKS[fallbackKey];
  if (fallbackUrl) {
    return { url: fallbackUrl, source: 'fallback' };
  }

  return { url: null, source: 'fallback' };
}

/**
 * Get gradient class for category-based fallback display.
 */
export function getCategoryFallbackStyle(category?: string | null): string {
  const colors = THEME_COLORS[category || ''];
  if (colors) {
    return `bg-gradient-to-br ${colors.bg} ${colors.accent}`;
  }
  return 'bg-gradient-to-br from-primary/5 to-secondary/5';
}

/**
 * Guess a category from article title for fallback purposes.
 */
export function guessCategoryFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  if (/\b(model|gpt|claude|gemini|llama|mistral|llm)\b/.test(lower)) return 'models';
  if (/\b(research|paper|study|benchmark|fine.tun|training)\b/.test(lower)) return 'research';
  if (/\b(deal|fund|invest|acqui|ipo|valuation|revenue|profit)\b/.test(lower)) return 'business';
  if (/\b(regulat|law|policy|biden|eu|govern|ethic|safety|bias)\b/.test(lower)) return 'policy';
  if (/\b(open.source|github|hugging|huggingface|releas)\b/.test(lower)) return 'open-source';
  if (/\b(startup|raise|seed|series)\b/.test(lower)) return 'startups';
  if (/\b(chip|gpu|tpu|hardware|nvidia|amd|processor)\b/.test(lower)) return 'hardware';
  if (/\b(agent|autonomous|tool.use|function.call)\b/.test(lower)) return 'agents';
  return null;
}

function resolveUrl(maybeRelative: string, baseUrl: string): string {
  if (maybeRelative.startsWith('http://') || maybeRelative.startsWith('https://')) {
    return maybeRelative;
  }
  try {
    const base = new URL(baseUrl);
    return new URL(maybeRelative, base.origin).href;
  } catch {
    return maybeRelative;
  }
}
