import { fetchHackerNewsTop, fetchHackerNewsAI } from '../../lib/social/hackernews';
import { fetchRedditAIPosts } from '../../lib/social/reddit';
import type { SocialPost } from '../../lib/social/types';

/**
 * Fetch social signals from all configured sources
 */
export async function fetchAllSocialSignals(): Promise<SocialPost[]> {
  const results: SocialPost[] = [];

  try {
    const [hnTop, hnAI, reddit] = await Promise.allSettled([
      fetchHackerNewsTop(),
      fetchHackerNewsAI(),
      fetchRedditAIPosts(),
    ]);

    if (hnTop.status === 'fulfilled') results.push(...hnTop.value);
    else console.warn('[Signals] HN top failed');

    if (hnAI.status === 'fulfilled') {
      // Deduplicate against hnTop
      const existing = hnTop.status === 'fulfilled' ? hnTop.value : [];
      const newAI = hnAI.value.filter((p) => !existing.some((e) => e.id === p.id));
      results.push(...newAI);
    }

    if (reddit.status === 'fulfilled') results.push(...reddit.value);
    else console.warn('[Signals] Reddit failed');

  } catch (err) {
    console.error('[Signals] Fatal:', err);
  }

  return results;
}
