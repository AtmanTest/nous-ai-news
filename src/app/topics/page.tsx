import type { Metadata } from 'next';
import Link from 'next/link';
import { pluralize } from '@/lib/format';
import { listTopicsWithCounts } from '@/modules/topics/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Thématiques' };

export default function TopicsPage() {
  const topics = listTopicsWithCounts();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Thématiques</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <li key={topic.slug} data-testid="topic-card" data-topic={topic.slug} className="rounded-2xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">
              <Link href={`/topics/${topic.slug}`} className="hover:text-accent hover:underline">
                {topic.label}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-muted">{topic.description}</p>
            <p data-testid="topic-count" className="mt-3 text-xs font-medium text-fg">
              {pluralize(topic.count, 'article')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
