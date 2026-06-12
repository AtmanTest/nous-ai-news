import type { SocialSignal } from './types';
import { fetchHackerNewsTop, fetchHackerNewsAI } from './hackernews';
import { fetchRedditAIPosts } from './reddit';

/**
 * Aggregate all social signals into a unified feed.
 */
export async function aggregateSocialSignals(): Promise<SocialSignal> {
  const [hnTop, hnAI, redditPosts] = await Promise.all([
    fetchHackerNewsTop(),
    fetchHackerNewsAI(),
    fetchRedditAIPosts(),
  ]);

  const allPosts = [
    ...hnTop.map((p) => ({ ...p })),
    ...hnAI.filter(
      // Deduplicate HN posts already in hnTop
      (p) => !hnTop.some((t) => t.id === p.id)
    ),
    ...redditPosts,
  ];

  // Sort by score (normalized)
  const sorted = allPosts.sort((a, b) => {
    const scoreA = a.score / (a.source === 'reddit' ? 100 : 1);
    const scoreB = b.score / (b.source === 'reddit' ? 100 : 1);
    return scoreB - scoreA;
  });

  // Extract trending topics
  const topicMentions = new Map<string, number>();
  for (const post of sorted) {
    const titleWords = post.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4 && !stopWords.has(w));

    for (const word of titleWords) {
      topicMentions.set(word, (topicMentions.get(word) || 0) + 1);
    }
  }

  const trendingTopics = [...topicMentions.entries()]
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([topic, mentions]) => ({
      topic,
      mentions,
      momentum: mentions / sorted.length,
    }));

  return {
    posts: sorted.slice(0, 50),
    trending_topics: trendingTopics,
    fetched_at: new Date().toISOString(),
    source: 'aggregated',
  };
}

const stopWords = new Set([
  'about', 'after', 'again', 'also', 'being', 'could', 'does',
  'doing', 'down', 'each', 'else', 'ever', 'from', 'good',
  'have', 'into', 'just', 'like', 'make', 'more', 'most',
  'much', 'need', 'next', 'only', 'other', 'over', 'really',
  'said', 'same', 'some', 'such', 'than', 'that', 'their',
  'them', 'then', 'they', 'this', 'very', 'want', 'what',
  'when', 'where', 'which', 'while', 'will', 'with', 'your',
  'look', 'back', 'even', 'still', 'things', 'thing', 'made',
  'take', 'time', 'year', 'first', 'also', 'well', 'way',
  'would', 'could', 'should', 'might', 'these', 'those',
  'there', 'here', 'after', 'until', 'while', 'since',
]);
