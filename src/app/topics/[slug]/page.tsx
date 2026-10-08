import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { listArticles } from '@/modules/articles/service';
import { MAX_PAGE_SIZE } from '@/modules/articles/validation';
import { getTopic } from '@/modules/topics/topics';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const topic = getTopic(params.slug);
  return { title: topic ? topic.label : 'Thématique introuvable' };
}

export default function TopicPage({ params }: PageProps) {
  const topic = getTopic(params.slug);
  if (!topic) notFound();

  const { items } = listArticles({ page: 1, pageSize: MAX_PAGE_SIZE, category: topic.slug, sort: 'newest' });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{topic.label}</h1>
        <p className="mt-1 text-gray-700">{topic.description}</p>
      </header>
      <div data-testid="topic-articles" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((article) => (
          <ArticleCard key={article.slug} article={article} as="h2" />
        ))}
      </div>
    </div>
  );
}
