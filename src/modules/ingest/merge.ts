import type { Article } from '@/modules/articles/types';
import { canonicalUrl } from './normalize';

export interface MergeOptions {
  maxItems: number;
  maxAgeDays: number;
  now: Date;
}

export const DEFAULT_MERGE: Omit<MergeOptions, 'now'> = { maxItems: 120, maxAgeDays: 30 };

function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/**
 * Fusionne les articles existants et les nouveaux : dédoublonnage par URL canonique puis par titre,
 * purge des articles trop anciens, tri du plus récent au plus ancien, plafond de volume.
 * Les articles existants sont prioritaires (stabilité des slugs).
 */
export function mergeArticles(existing: readonly Article[], incoming: readonly Article[], options: MergeOptions): Article[] {
  const minTime = options.now.getTime() - options.maxAgeDays * 86_400_000;
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const kept: Article[] = [];

  for (const article of [...existing, ...incoming]) {
    const url = canonicalUrl(article.sourceUrl ?? '');
    const title = titleKey(article.title);
    if (new Date(article.publishedAt).getTime() < minTime) continue;
    if ((url !== '' && seenUrls.has(url)) || seenTitles.has(title)) continue;
    if (url !== '') seenUrls.add(url);
    seenTitles.add(title);
    kept.push(article);
  }

  return kept
    .sort((a, b) => (a.publishedAt === b.publishedAt ? a.id.localeCompare(b.id) : a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, options.maxItems);
}
