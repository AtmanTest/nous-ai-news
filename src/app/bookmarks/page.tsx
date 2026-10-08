import type { Metadata } from 'next';
import { BookmarksView } from '@/components/BookmarksView';
import { ARTICLES } from '@/modules/articles/data';
import { toSummary } from '@/modules/articles/service';

export const metadata: Metadata = { title: 'Favoris' };

export default function BookmarksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Mes favoris</h1>
      <p className="text-gray-700">Vos favoris sont enregistrés uniquement dans ce navigateur.</p>
      <BookmarksView articles={ARTICLES.map(toSummary)} />
    </div>
  );
}
