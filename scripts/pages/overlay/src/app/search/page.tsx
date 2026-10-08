'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { pluralize } from '@/lib/format';
import { searchArticles } from '@/modules/search/service';
import { MIN_QUERY_LENGTH, parseSearchParams } from '@/modules/search/validation';

// Version statique : la recherche s'exécute dans le navigateur sur le jeu de données embarqué.
function SearchBody() {
  const rawQuery = useSearchParams().get('q');

  if (rawQuery === null) {
    return <p className="text-gray-700">Saisissez au moins {MIN_QUERY_LENGTH} caractères dans la barre de recherche pour trouver un article.</p>;
  }
  const parsed = parseSearchParams({ q: rawQuery });
  if (!parsed.ok) {
    return (
      <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
        {parsed.errors[0]?.message}
      </p>
    );
  }
  const { results, total } = searchArticles(parsed.value);
  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-400 bg-white p-8 text-center">
        <p className="font-medium">Aucun résultat pour « {parsed.value.q} ».</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-gray-700" aria-live="polite">
        {pluralize(total, 'résultat')} pour « {parsed.value.q} »
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((article) => (
          <ArticleCard key={article.slug} article={article} as="h2" />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Recherche</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <SearchBody />
      </Suspense>
    </div>
  );
}
