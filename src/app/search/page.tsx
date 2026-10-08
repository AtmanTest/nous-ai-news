import type { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { first, type RawParams } from '@/lib/params';
import { pluralize } from '@/lib/format';
import { searchArticles } from '@/modules/search/service';
import { MIN_QUERY_LENGTH, parseSearchParams } from '@/modules/search/validation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Recherche' };

export default function SearchPage({ searchParams }: { searchParams: RawParams }) {
  const rawQuery = first(searchParams, 'q');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Recherche</h1>
      <SearchBody rawQuery={rawQuery} />
    </div>
  );
}

function SearchBody({ rawQuery }: { rawQuery: string | undefined }) {
  if (rawQuery === undefined) {
    return (
      <p data-testid="search-prompt" className="text-muted">
        Saisissez au moins {MIN_QUERY_LENGTH} caractères dans la barre de recherche pour trouver un article.
      </p>
    );
  }

  const parsed = parseSearchParams({ q: rawQuery });
  if (!parsed.ok) {
    return (
      <p role="alert" data-testid="search-error" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
        {parsed.errors[0]?.message}
      </p>
    );
  }

  const { results, total } = searchArticles(parsed.value);

  if (total === 0) {
    return (
      <div data-testid="search-empty" className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <p className="font-medium">Aucun résultat pour « {parsed.value.q} ».</p>
        <p className="mt-2 text-sm text-muted">Essayez un autre mot-clé ou vérifiez l’orthographe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p data-testid="search-count" className="text-muted" aria-live="polite">
        {pluralize(total, 'résultat')} pour « {parsed.value.q} »
      </p>
      <div data-testid="search-results" className="grid gap-4 sm:grid-cols-2">
        {results.map((article) => (
          <ArticleCard key={article.slug} article={article} as="h2" />
        ))}
      </div>
    </div>
  );
}
