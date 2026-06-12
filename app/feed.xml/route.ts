import { createAdminClient } from '@/lib/supabase/server';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  category: string | null;
  tags: string[];
  published_at: string;
  url: string;
}

export async function GET() {
  const supabase = await createAdminClient();
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, summary, image_url, source_name, category, tags, published_at, url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (!articles || articles.length === 0) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Nous AI News</title></channel></rss>', {
      headers: { 'Content-Type': 'application/rss+xml' },
    });
  }

  const items = articles.map((article: Article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${escapeXml(article.url || `https://daily-ai.vercel.app/article/${article.id}`)}</link>
      <description><![CDATA[${article.summary || article.title}]]></description>
      <pubDate>${new Date(article.published_at).toUTCString()}</pubDate>
      <guid isPermaLink="false">${article.id}</guid>
      <source>${escapeXml(article.source_name)}</source>
      ${article.category ? `<category>${escapeXml(article.category)}</category>` : ''}
      ${article.image_url ? `<enclosure url="${escapeXml(article.image_url)}" type="image/jpeg" />` : ''}
    </item>
  `).join('\n');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nous AI News — Global AI Coverage</title>
    <link>https://daily-ai.vercel.app</link>
    <description>Premium international AI news platform covering models, research, business, policy, and open source.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://daily-ai.vercel.app/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
