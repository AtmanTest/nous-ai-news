import { ARTICLES } from '@/modules/articles/data';
import type { Article } from '@/modules/articles/types';
import { TOPICS, type Topic } from './topics';

export interface TopicWithCount extends Topic {
  count: number;
}

export function listTopicsWithCounts(source: readonly Pick<Article, 'category'>[] = ARTICLES): TopicWithCount[] {
  return TOPICS.map((topic) => ({
    ...topic,
    count: source.filter((article) => article.category === topic.slug).length,
  }));
}
