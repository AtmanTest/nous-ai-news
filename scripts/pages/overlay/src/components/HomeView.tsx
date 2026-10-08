import { ArticleCard } from '@/components/ArticleCard';
import { Pagination } from '@/components/Pagination';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import { listArticles } from '@/modules/articles/service';

export function HomeView({ page }: { page: number }) {
  const { items, meta } = listArticles({ page, pageSize: 9, sort: 'newest' });
  return (
    <div className="space-y-10">
      <section aria-labelledby="hero-title">
        <h1 id="hero-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {SITE_NAME}
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-gray-700">{SITE_TAGLINE}</p>
      </section>
      <section aria-labelledby="latest-title">
        <h2 id="latest-title" className="mb-4 text-xl font-semibold">
          Dernières actualités
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.slug} article={article} as="h3" />
          ))}
        </div>
        <Pagination page={meta.page} totalPages={meta.totalPages} basePath="/" />
      </section>
    </div>
  );
}
