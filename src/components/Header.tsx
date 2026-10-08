import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

const NAV_ITEMS = [
  { href: '/', label: 'Accueil' },
  { href: '/topics', label: 'Thématiques' },
  { href: '/bookmarks', label: 'Favoris' },
  { href: '/newsletter', label: 'Newsletter' },
] as const;

export function Header() {
  return (
    <header data-testid="site-header" className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-fg">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-sm font-black text-white shadow-card"
          >
            N
          </span>
          {SITE_NAME}
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="flex flex-wrap gap-1 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-lg px-3 py-1.5 text-fg transition hover:bg-surface-2 hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form action="/search" method="get" role="search" className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          <label htmlFor="header-search" className="sr-only">
            Rechercher un article
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="Rechercher…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3.5 py-2 text-sm text-fg placeholder:text-muted sm:w-60 sm:flex-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-dark"
          >
            Rechercher
          </button>
        </form>
      </div>
    </header>
  );
}
