/**
 * Revalidate Next.js ISR cache for important pages
 */
export async function revalidateSite(): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nous-ai-news.com';
  const revalidateSecret = process.env.REVALIDATION_SECRET || 'shield-secret';

  const paths = [
    '/',
    '/trending',
    '/search',
    '/topics/models',
    '/topics/research',
    '/topics/business',
    '/topics/policy',
    '/topics/open-source',
    '/topics/startups',
  ];

  for (const path of paths) {
    try {
      const url = `${siteUrl}/api/revalidate?secret=${revalidateSecret}&path=${encodeURIComponent(path)}`;
      await fetch(url, { method: 'POST' });
      console.log(`[Revalidate] ✅ ${path}`);
    } catch (err) {
      console.warn(`[Revalidate] ⚠ ${path}: ${err}`);
    }
  }
}
