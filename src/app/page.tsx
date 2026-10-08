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
      <section
        aria-labelledby="hero-title"
        data-testid="hero"
        className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-10 shadow-card sm:px-10 sm:py-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-pink-500/30 blur-3xl"
        />
        <p className="relative inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Veille automatique · mise à jour toutes les 3 heures
        </p>
        <h1 id="hero-title" className="relative mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {SITE_NAME}
        </h1>
        <p className="relative mt-3 max-w-2xl text-lg text-muted">{SITE_TAGLINE}</p>
      </section>

      <section aria-labelledby="latest-title">
        <h2 id="latest-title" className="mb-4 text-xl font-semibold">
          Dernières actualités
        </h2>
        <div data-testid="article-grid" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article, index) => (
            <ArticleCard key={article.slug} article={article} as="h3" featured={meta.page === 1 && index === 0} />
          ))}
        </div>
        <Pagination page={meta.page} totalPages={meta.totalPages} basePath="/" />
      </section>
    </div>
  );
}
