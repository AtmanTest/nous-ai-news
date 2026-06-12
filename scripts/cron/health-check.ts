/**
 * Health check the site: homepage, API, DB latency
 */
export async function checkSiteHealth(): Promise<{ score: number; errors: string[] }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nous-ai-news.com';
  const errors: string[] = [];
  let score = 100;

  // Check homepage
  try {
    const res = await fetch(siteUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      errors.push(`Homepage: HTTP ${res.status}`);
      score -= 30;
    }
  } catch {
    errors.push('Homepage: unreachable');
    score -= 30;
  }

  // Check search API
  try {
    const res = await fetch(`${siteUrl}/api/search?q=ai&limit=1`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      errors.push(`Search API: HTTP ${res.status}`);
      score -= 20;
    }
  } catch {
    errors.push('Search API: unreachable');
    score -= 20;
  }

  // Check social API
  try {
    const res = await fetch(`${siteUrl}/api/social`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      errors.push(`Social API: HTTP ${res.status}`);
      score -= 10;
    }
  } catch {
    errors.push('Social API: unreachable');
    score -= 10;
  }

  // Check sitemap
  try {
    const res = await fetch(`${siteUrl}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      errors.push(`Sitemap: HTTP ${res.status}`);
      score -= 10;
    }
  } catch {
    errors.push('Sitemap: unreachable');
    score -= 10;
  }

  return { score: Math.max(0, score), errors };
}
