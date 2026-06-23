import { describe, expect, it } from 'vitest';
import { cleanArticleText, normalizeArticle } from '@/lib/content/normalize';

describe('RSS text sanitization', () => {
  it('removes encoded literal CDATA wrappers from RSS titles before ingestion', () => {
    expect(cleanArticleText('&lt;![CDATA[[AINews] GLM &gt; GPT?]]&gt;')).toBe('[AINews] GLM > GPT?');
    expect(cleanArticleText('&lt;![CDATA[Useful &amp;amp; readable summary]]&gt;')).toBe('Useful & readable summary');
  });

  it('decodes common and numeric HTML entities without changing already-clean titles', () => {
    expect(cleanArticleText('Already clean title')).toBe('Already clean title');
    expect(cleanArticleText('GPT&#x2D;5 &mdash; test &#65;')).toBe('GPT-5 — test A');
    expect(cleanArticleText(null)).toBe('');
  });

  it('normalizes raw article titles defensively even if a source bypasses the RSS parser', () => {
    const normalized = normalizeArticle({
      url: 'https://example.com/raw',
      title: '<![CDATA[[Exclusive] $250 off AI Engineer tix til Monday]]>',
      summary: '<![CDATA[Summary &amp; context]]>',
      source_name: 'Latent Space',
      source_type: 'rss',
      source_url: 'https://example.com/feed.xml',
      published_at: '2026-06-22T10:00:00Z',
    }, 'latent-space');

    expect(normalized.title).toBe('[Exclusive] $250 off AI Engineer tix til Monday');
    expect(normalized.summary).toBe('Summary & context');
    expect(normalized.title).not.toContain('CDATA');
    expect(normalized.tags.join(' ')).not.toMatch(/cdata/i);
  });

  it('removes partial CDATA fragments from generated tags', () => {
    const normalized = normalizeArticle({
      url: 'https://example.com/bloomberg',
      title: '<![CDATA[Gold Steadies as US and Iran Flag Early Progress in Peace Talks]]>',
      summary: '<![CDATA[Markets summary]]>',
      source_name: 'Bloomberg AI',
      source_type: 'rss',
      source_url: 'https://example.com/feed.xml',
      published_at: '2026-06-22T10:00:00Z',
    }, 'bloomberg-ai');

    expect(normalized.tags).toEqual(expect.arrayContaining(['gold steadies']));
    expect(normalized.tags.join(' ')).not.toMatch(/<!|CDATA|\]\]>/i);
  });

  it('keeps entity and score detection working after sanitization', () => {
    const normalized = normalizeArticle({
      url: 'https://example.com/openai',
      title: '<![CDATA[Breaking: OpenAI reveals GPT-4o research update]]>',
      summary: 'Résumé avec accent français',
      content: 'x'.repeat(600),
      source_name: 'OpenAI Blog',
      source_type: 'rss',
      source_url: 'https://example.com/feed.xml',
      published_at: '2026-06-22T10:00:00Z',
    }, 'openai-blog');

    expect(normalized.language).toBe('fr');
    expect(normalized.is_breaking).toBe(true);
    expect(normalized.score).toBe(93);
    expect(normalized.entities).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'company', name: 'openai' }),
      expect.objectContaining({ type: 'model', name: 'gpt-4' }),
    ]));
  });
});
