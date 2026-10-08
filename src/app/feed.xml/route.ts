import { escapeXml } from '@/lib/xml';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import { ARTICLES } from '@/modules/articles/data';
import { getTopicLabel } from '@/modules/topics/topics';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const articles = [...ARTICLES].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  const items = articles
    .map((article) => {
      const link = `${origin}/articles/${article.slug}`;
      return [
        '    <item>',
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`,
        `      <category>${escapeXml(getTopicLabel(article.category))}</category>`,
        `      <description>${escapeXml(article.summary)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${escapeXml(origin)}</link>`,
    `    <description>${escapeXml(SITE_TAGLINE)}</description>`,
    '    <language>fr-FR</language>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
