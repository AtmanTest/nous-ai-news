import Link from 'next/link';
import { CategoryBadge } from '@/components/CategoryBadge';
import { formatDateFr, formatReading } from '@/lib/format';
import type { ArticleSummary } from '@/modules/articles/types';

interface ArticleCardProps {
  article: ArticleSummary;
  /** Niveau de titre, pour conserver une hiérarchie h1 > h2 > h3 correcte selon la page. */
  as?: 'h2' | 'h3';
  /** Mise en avant (première carte de l'accueil). */
  featured?: boolean;
}

export function ArticleCard({ article, as: Heading = 'h3', featured = false }: ArticleCardProps) {
  return (
    <article
      data-testid="article-card"
      className={`group relative flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        featured ? 'lg:col-span-2 lg:p-7' : ''
      }`}
    >
      <CategoryBadge category={article.category} />
      <Heading className={`font-semibold leading-snug tracking-tight ${featured ? 'text-2xl lg:text-3xl' : 'text-lg'}`}>
        <Link
          href={`/articles/${article.slug}`}
          className="after:absolute after:inset-0 after:rounded-2xl group-hover:text-accent"
        >
          {article.title}
        </Link>
      </Heading>
      <p className={`text-muted ${featured ? 'text-base' : 'line-clamp-3 text-sm'}`}>{article.summary}</p>
      <p className="mt-auto flex flex-wrap items-center gap-x-2 pt-1 text-xs text-muted">
        <span className="font-medium text-fg">{article.source}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={article.publishedAt}>{formatDateFr(article.publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{formatReading(article.readingMinutes)}</span>
      </p>
    </article>
  );
}
