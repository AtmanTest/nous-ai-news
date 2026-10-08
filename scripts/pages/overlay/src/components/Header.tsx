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
    <header data-testid="site-header" className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-ink">
          {SITE_NAME}
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-gray-800 underline-offset-4 hover:text-accent hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/search/`} method="get" role="search" className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          <label htmlFor="header-search" className="sr-only">
            Rechercher un article
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="Rechercher…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded border border-gray-400 px-3 py-1.5 text-sm sm:w-56 sm:flex-none"
          />
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Rechercher
          </button>
        </form>
      </div>
    </header>
  );
}
