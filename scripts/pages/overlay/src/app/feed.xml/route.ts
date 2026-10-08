import { escapeXml } from '@/lib/xml';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import { ARTICLES } from '@/modules/articles/data';
import { getTopicLabel } from '@/modules/topics/topics';

export const dynamic = 'force-static';

export function GET() {
  const origin = `${process.env.SITE_ORIGIN ?? ''}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}`;
  const articles = [...ARTICLES].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const items = articles
    .map((a) => {
      const link = `${origin}/articles/${a.slug}/`;
      return `    <item><title>${escapeXml(a.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate><category>${escapeXml(getTopicLabel(a.category))}</category><description>${escapeXml(a.summary)}</description></item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${escapeXml(SITE_NAME)}</title><link>${escapeXml(origin)}</link><description>${escapeXml(SITE_TAGLINE)}</description><language>fr-FR</language>\n${items}\n</channel></rss>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
