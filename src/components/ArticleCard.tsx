import Link from 'next/link';
import { formatDateFr, formatReading } from '@/lib/format';
import type { ArticleSummary } from '@/modules/articles/types';
import { getTopicLabel } from '@/modules/topics/topics';

interface ArticleCardProps {
  article: ArticleSummary;
  /** Niveau de titre, pour conserver une hiérarchie h1 > h2 > h3 correcte selon la page. */
  as?: 'h2' | 'h3';
}

export function ArticleCard({ article, as: Heading = 'h3' }: ArticleCardProps) {
  return (
    <article data-testid="article-card" className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <p
        data-testid="article-category"
        data-category={article.category}
        className="w-fit rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900"
      >
        {getTopicLabel(article.category)}
      </p>
      <Heading className="text-lg font-semibold leading-snug">
        <Link href={`/articles/${article.slug}`} className="hover:text-accent hover:underline">
          {article.title}
        </Link>
      </Heading>
      <p className="text-sm text-gray-700">{article.summary}</p>
      <p className="mt-auto text-xs text-gray-700">
        <time dateTime={article.publishedAt}>{formatDateFr(article.publishedAt)}</time> ·{' '}
        {formatReading(article.readingMinutes)}
      </p>
    </article>
  );
}
