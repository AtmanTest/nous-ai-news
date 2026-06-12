import type { SocialPost } from './types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';
const HN_STORIES_COUNT = 30;

/**
 * Fetch top stories from Hacker News Firebase API (free, no auth).
 */
export async function fetchHackerNewsTop(): Promise<SocialPost[]> {
  try {
    // Get top story IDs
    const response = await fetch(`${HN_API_BASE}/topstories.json`, {
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!response.ok) throw new Error(`HN topstories: ${response.status}`);

    const ids: number[] = await response.json();
    const topIds = ids.slice(0, HN_STORIES_COUNT);

    // Fetch individual stories in parallel
    const storyPromises = topIds.map((id) =>
      fetch(`${HN_API_BASE}/item/${id}.json`)
        .then((r) => r.json())
        .catch(() => null)
    );

    const stories = await Promise.all(storyPromises);

    return stories
      .filter((s): s is NonNullable<typeof s> => s && s.type === 'story' && s.title)
      .map((s) => ({
        id: `hn-${s.id}`,
        source: 'hackernews' as const,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        title: s.title,
        text: s.text || undefined,
        author: s.by || 'anonymous',
        score: s.score || 0,
        comments: s.descendants || 0,
        timestamp: new Date((s.time || 0) * 1000).toISOString(),
        tags: extractHNTags(s.title, s.url || ''),
        external_url: s.url || undefined,
      }))
      .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('[HN Fetcher] Error:', error);
    return [];
  }
}

/**
 * Fetch stories that mention AI/ML keywords.
 * HN API doesn't support search, so we filter top stories.
 */
export async function fetchHackerNewsAI(): Promise<SocialPost[]> {
  const all = await fetchHackerNewsTop();
  const aiKeywords = [
    'ai', 'gpt', 'llm', 'machine learning', 'deep learning',
    'neural', 'openai', 'anthropic', 'claude', 'gemini',
    'llama', 'mistral', 'transformer', 'diffusion',
    'agent', 'rag', 'fine-tun', 'token', 'model',
  ];

  return all.filter((post) => {
    const lower = `${post.title} ${post.tags.join(' ')}`.toLowerCase();
    return aiKeywords.some((kw) => lower.includes(kw));
  });
}

function extractHNTags(title: string, url: string): string[] {
  const tags: string[] = [];
  const lower = `${title} ${url}`.toLowerCase();

  const tagPatterns: [RegExp, string][] = [
    [/\b(ai|artificial intelligence)\b/i, 'ai'],
    [/\b(llm|large language model)\b/i, 'llm'],
    [/\b(open source|oss)\b/i, 'open-source'],
    [/\b(startup|yc)\b/i, 'startups'],
    [/\b(research|paper)\b/i, 'research'],
    [/\b(security|privacy)\b/i, 'security'],
    [/\b(robotics|robot)\b/i, 'robotics'],
    [/\b(programming|coding|code)\b/i, 'programming'],
  ];

  for (const [pattern, tag] of tagPatterns) {
    if (pattern.test(lower)) tags.push(tag);
  }

  return [...new Set(tags)];
}
