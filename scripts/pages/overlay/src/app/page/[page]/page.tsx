import { notFound } from 'next/navigation';
import { HomeView } from '@/components/HomeView';
import { listArticles } from '@/modules/articles/service';

export const dynamicParams = false;

export function generateStaticParams() {
  const { meta } = listArticles({ page: 1, pageSize: 9, sort: 'newest' });
  return Array.from({ length: Math.max(meta.totalPages - 1, 0) }, (_, i) => ({ page: String(i + 2) }));
}

export default function HomePaged({ params }: { params: { page: string } }) {
  const page = Number(params.page);
  if (!Number.isInteger(page) || page < 2) notFound();
  return <HomeView page={page} />;
}
