import type { NormalizedArticle } from '../content/types';
import { normalizeArticle, cleanArticleText } from '../content/normalize';

interface FeedItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate?: string;
  image?: string;
  categories?: string[];
}

interface ParsedFeed {
  title: string;
  items: FeedItem[];
  error?: string;
}

export async function fetchRSS(feedUrl: string, timeoutMs: number = 15000): Promise<ParsedFeed> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'NousAINews/1.0 (news aggregator; https://daily-ai.com)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { title: '', items: [], error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const xml = await response.text();
    return parseFeedXML(xml, feedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fetch error';
    return { title: '', items: [], error: message };
  }
}

function extractImageFromHtml(html: string): string | undefined {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']*?)["']/i);
  if (imgMatch) {
    const src = imgMatch[1];
    if (!src.startsWith('data:') && !src.includes('1x1') && !src.includes('pixel') && !src.includes('tracker')) {
      return src;
    }
  }
  return undefined;
}

function parseFeedXML(xml: string, feedUrl: string): ParsedFeed {
  void feedUrl;
  const items: FeedItem[] = [];

  // Extract RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const rawDescription = extractTag(itemXml, 'description') || '';
    const rawContent = extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'content') || '';
    
    // Use content as description if description is empty (common for Reddit)
    const descriptionHtml = rawDescription || rawContent;
    const contentHtml = rawContent;

    const item: FeedItem = {
      title: cleanArticleText(extractTag(itemXml, 'title') || ''),
      link: extractTag(itemXml, 'link') || '',
      description: stripHtml(descriptionHtml),
      content: stripHtml(contentHtml),
      author: extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'author') || undefined,
      pubDate: extractTag(itemXml, 'pubDate') || undefined,
      categories: extractTags(itemXml, 'category'),
    };

    // Extract image from RSS item (multiple strategies)
    item.image = extractImageFromRssItem(itemXml);

    if (item.title && item.link) {
      items.push(item);
    }
  }

  // Extract Atom entries
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const descHtml = extractTag(entryXml, 'summary');
      const contentHtml = extractTag(entryXml, 'content');
      const item: FeedItem = {
        title: extractTag(entryXml, 'title') || '',
        link: extractAtomLink(entryXml),
        description: stripHtml(descHtml),
        content: stripHtml(contentHtml),
        author: extractTag(entryXml, 'name') || undefined,
        pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated') || undefined,
        categories: extractTags(entryXml, 'category'),
      };

      // Extract image for Atom entry
      item.image = extractImageFromRssItem(entryXml);
      if (!item.image) {
        item.image = extractImageFromHtml(descHtml || contentHtml || '');
      }

      if (item.title && item.link) {
        items.push(item);
      }
    }
  }

  const feedTitle = extractTag(xml, 'title') || extractTag(xml, 'feed', 'title') || 'Untitled Feed';

  return { title: feedTitle, items };
}

function extractImageFromRssItem(xml: string): string | undefined {
  // 1. media:thumbnail
  const thumbMatch = xml.match(/<media:thumbnail[^>]*url=["']([^"']*?)["']/i);
  if (thumbMatch) return thumbMatch[1];

  // 2. media:content with medium="image"
  const contentMatch = xml.match(/<media:content[^>]*url=["']([^"']*?)["'][^>]*medium=["']image["']/i) ||
                       xml.match(/<media:content[^>]*medium=["']image["'][^>]*url=["']([^"']*?)["']/i);
  if (contentMatch) return contentMatch[1] || contentMatch[2];

  // 3. enclosure with image type
  const enclMatch = xml.match(/<enclosure[^>]*url=["']([^"']*?)["'][^>]*type=["']image\//i);
  if (enclMatch) return enclMatch[1];

  // 4. <img> inside description or content HTML
  const descHtml = extractTag(xml, 'description');
  const contentHtml = extractTag(xml, 'content:encoded') || extractTag(xml, 'content');
  const htmlSource = contentHtml || descHtml;
  if (htmlSource) {
    const img = extractImageFromHtml(htmlSource);
    if (img) return img;
  }

  // 5. Reddit-specific: external-preview.redd.it images in tables
  const redditImgMatch = htmlSource?.match(/https:\/\/external-preview\.redd\.it\/[^"'\s>]+/i);
  if (redditImgMatch) return redditImgMatch[0];

  return undefined;
}

function extractTag(xml: string, tag: string, parentTag?: string): string {
  const regex = parentTag
    ? new RegExp(`<${parentTag}[^>]*>[\s\S]*?<${tag}[^>]*>(.*?)<\/${tag}>[\s\S]*?<\/${parentTag}>`, 'i')
    : new RegExp(`<${tag}[^>]*><!\[CDATA\[(.*?)\]\]><\/${tag}>|<${tag}[^>]*>(.*?)<\/${tag}>`, 'is');

  const match = regex.exec(xml);
  if (match) {
    return (match[1] || match[2] || '').trim();
  }
  return '';
}

function extractTags(xml: string, tag: string): string[] {
  const tags: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gi');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    tags.push(match[1].trim());
  }
  return tags;
}

function extractAtomLink(xml: string): string {
  const regex = /<link[^>]*href=["']([^"']*?)["'][^>]*rel=["']alternate["'][^>]*\/?>|<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']*?)["'][^>]*\/?>|<link[^>]*href=["']([^"']*?)["'][^>]*\/?>/i;
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || match[3] || '').trim() : '';
}

function stripHtml(html: string): string {
  const text = html
    // Remove Reddit's SC_OFF/SC_ON comments and md div wrappers
    .replace(/<!--\s*SC_OFF\s*-->/gi, '')
    .replace(/<!--\s*SC_ON\s*-->/gi, '')
    .replace(/<div[^>]*class=["']md["'][^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Decode numeric entities: &#32; &#x20; etc.
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decode other common entities
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return cleanArticleText(text);
}

export function feedItemsToNormalized(
  items: FeedItem[],
  sourceId: string,
  sourceName: string,
  sourceType: 'rss' | 'api' | 'social' | 'newsapi' = 'rss'
): NormalizedArticle[] {
  return items.map((item) =>
    normalizeArticle(
      {
        url: item.link,
        title: item.title,
        summary: item.description,
        content: item.content,
        author: item.author,
        published_at: item.pubDate,
        image_url: item.image,
        source_name: sourceName,
        source_type: sourceType,
        source_url: '', // Will be set by caller
        tags: item.categories,
      },
      sourceId
    )
  );
}