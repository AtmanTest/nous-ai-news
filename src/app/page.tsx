import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { Pagination } from '@/components/Pagination';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import { first, type RawParams } from '@/lib/params';
import { listArticles } from '@/modules/articles/service';
import { parseListParams } from '@/modules/articles/validation';

export const dynamic = 'force-dynamic';

export default function HomePage({ searchParams }: { searchParams: RawParams }) {
  // Seul `page` est pris en compte sur la page d'accueil ; une valeur invalide ou hors plage donne un 404.
  const rawPage = first(searchParams, 'page');
  const parsed = parseListParams(rawPage === undefined ? {} : { page: rawPage });
  if (!parsed.ok) notFound();

  const { items, meta } = listArticles(parsed.value);
  if (meta.totalPages > 0 && meta.page > meta.totalPages) notFound();

  return (
    <div className="space-y-10">
      <section aria-labelledby="hero-title" data-testid="hero">
        <h1 id="hero-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {SITE_NAME}
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-gray-700">{SITE_TAGLINE}</p>
      </section>

      <section aria-labelledby="latest-title">
        <h2 id="latest-title" className="mb-4 text-xl font-semibold">
          Dernières actualités
        </h2>
        <div data-testid="article-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.slug} article={article} as="h3" />
          ))}
        </div>
        <Pagination page={meta.page} totalPages={meta.totalPages} basePath="/" />
      </section>
    </div>
  );
}
