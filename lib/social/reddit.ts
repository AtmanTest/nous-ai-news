import type { SocialPost } from './types';

const REDDIT_BASE = 'https://www.reddit.com';

/**
 * Fetch hot posts from AI/ML subreddits via Reddit's public JSON API (free, no auth).
 */
export async function fetchRedditAIPosts(
  subreddits: string[] = ['artificial', 'MachineLearning', 'LocalLLaMA', 'OpenAI', 'singularity'],
  limit: number = 25
): Promise<SocialPost[]> {
  try {
    const results = await Promise.all(
      subreddits.map((sub) =>
        fetch(`${REDDIT_BASE}/r/${sub}/hot.json?limit=${limit}`, {
          headers: {
            'User-Agent': 'NousAINews/1.0 (by /u/daily-ai)',
            'Accept': 'application/json',
          },
        })
          .then((r) => r.json())
          .then((data) => parseRedditPosts(data, sub))
          .catch((err) => {
            console.warn(`[Reddit] r/${sub}: ${err.message}`);
            return [] as SocialPost[];
          })
      )
    );

    return results.flat().sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('[Reddit Fetcher] Error:', error);
    return [];
  }
}

function parseRedditPosts(data: Record<string, unknown>, subreddit: string): SocialPost[] {
  if (!(data?.data as Record<string, unknown>)?.children) return [];

  return ((data.data as Record<string, unknown>).children as Array<Record<string, unknown>>)
    .filter((child) => child.kind === 't3' && child.data && !(child.data as Record<string, unknown>).stickied)
    .map((child) => {
      const p = child.data as Record<string, unknown>;
      return {
        id: `reddit-${p.id as string}`,
        source: 'reddit' as const,
        url: `https://www.reddit.com${p.permalink as string}`,
        title: p.title as string,
        text: ((p.selftext as string) || '').slice(0, 500) || undefined,
        author: (p.author as string) || 'anonymous',
        score: (p.ups as number) || 0,
        comments: (p.num_comments as number) || 0,
        timestamp: new Date(((p.created_utc as number) || 0) * 1000).toISOString(),
        tags: extractRedditTags(p.title as string, subreddit),
        external_url: typeof p.url === 'string' && (p.url as string).startsWith('http') ? p.url as string : undefined,
        thumbnail_url: typeof p.thumbnail === 'string' && (p.thumbnail as string).startsWith('http') ? p.thumbnail as string : undefined,
      };
    });
}

function extractRedditTags(title: string, subreddit: string): string[] {
  const tags = new Set<string>();
  const lower = title.toLowerCase();

  // Add subreddit as tag
  tags.add(subreddit.toLowerCase());

  // Add AI-specific tags
  const tagPatterns: [RegExp, string][] = [
    [/\b(model|release|launch)\b/i, 'models'],
    [/\b(tutorial|guide|how to)\b/i, 'tutorial'],
    [/\b(paper|research|arxiv)\b/i, 'research'],
    [/\b(tool|app|software)\b/i, 'tools'],
    [/\b(discussion|question|help)\b/i, 'discussion'],
    [/\b(news|update|announcement)\b/i, 'news'],
    [/\b(showcase|project|built)\b/i, 'showcase'],
  ];

  for (const [pattern, tag] of tagPatterns) {
    if (pattern.test(lower)) tags.add(tag);
  }

  return [...tags];
}
