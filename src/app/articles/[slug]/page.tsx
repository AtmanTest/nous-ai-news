import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { BookmarkButton } from '@/components/BookmarkButton';
import { categoryClasses } from '@/components/CategoryBadge';
import { formatDateFr, formatReading } from '@/lib/format';
import { getArticleBySlug, getRelatedArticles } from '@/modules/articles/service';
import { getTopicLabel } from '@/modules/topics/topics';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const article = getArticleBySlug(params.slug);
  if (!article) return { title: 'Article introuvable' };
  return { title: article.title, description: article.summary };
}

export default function ArticlePage({ params }: PageProps) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const related = getRelatedArticles(article, 2);

  return (
    <div className="space-y-12">
      <article className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <header data-testid="article-header" className="space-y-3">
          <p>
            <Link
              href={`/topics/${article.category}`}
              data-testid="article-category"
              data-category={article.category}
              className={`${categoryClasses(article.category)} hover:underline`}
            >
              {getTopicLabel(article.category)}
            </Link>
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
          <p data-testid="article-meta" className="text-sm text-muted">
            {article.source} · <time dateTime={article.publishedAt}>{formatDateFr(article.publishedAt)}</time> ·{' '}
            {formatReading(article.readingMinutes)}
          </p>
          <ul data-testid="article-tags" className="flex flex-wrap gap-2 text-xs">
            {article.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-muted">
                {tag}
              </li>
            ))}
          </ul>
        </header>

        <p className="mt-6 text-lg font-medium text-fg">{article.summary}</p>

        <div data-testid="article-body" className="mt-6 space-y-4 text-base leading-relaxed">
          {article.body
            .filter((paragraph) => paragraph !== article.summary)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>

        {article.sourceUrl && (
          <p className="mt-6">
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="article-source-link"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-dark"
            >
              Lire l’article sur {article.source} <span aria-hidden="true">↗</span>
            </a>
          </p>
        )}

        <div className="mt-8">
          <BookmarkButton slug={article.slug} />
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" data-testid="related-articles">
          <h2 id="related-title" className="mb-4 text-xl font-semibold">
            À lire aussi
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((item) => (
              <ArticleCard key={item.slug} article={item} as="h3" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
