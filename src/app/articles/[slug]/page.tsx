import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { BookmarkButton } from '@/components/BookmarkButton';
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
      <article className="mx-auto max-w-3xl">
        <header data-testid="article-header" className="space-y-3">
          <p>
            <Link
              href={`/topics/${article.category}`}
              data-testid="article-category"
              data-category={article.category}
              className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900 hover:underline"
            >
              {getTopicLabel(article.category)}
            </Link>
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">{article.title}</h1>
          <p data-testid="article-meta" className="text-sm text-gray-700">
            {article.source} · <time dateTime={article.publishedAt}>{formatDateFr(article.publishedAt)}</time> ·{' '}
            {formatReading(article.readingMinutes)}
          </p>
          <ul data-testid="article-tags" className="flex flex-wrap gap-2 text-xs">
            {article.tags.map((tag) => (
              <li key={tag} className="rounded border border-gray-300 bg-white px-2 py-0.5 text-gray-800">
                {tag}
              </li>
            ))}
          </ul>
        </header>

        <p className="mt-6 text-lg font-medium text-gray-800">{article.summary}</p>

        <div data-testid="article-body" className="mt-6 space-y-4 text-base leading-relaxed">
          {article.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

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
