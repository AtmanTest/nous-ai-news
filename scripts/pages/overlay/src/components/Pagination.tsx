import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
}

// Version statique : pagination par chemins (/page/2/) car GitHub Pages ne gère pas les requêtes serveur.
function hrefFor(page: number): string {
  return page <= 1 ? '/' : `/page/${page}/`;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
      <div className="w-32">
        {page > 1 && (
          <Link href={hrefFor(page - 1)} rel="prev" className="font-medium text-accent underline underline-offset-4">
            ← Précédent
          </Link>
        )}
      </div>
      <p className="text-gray-700">
        Page {page} sur {totalPages}
      </p>
      <div className="w-32 text-right">
        {page < totalPages && (
          <Link href={hrefFor(page + 1)} rel="next" className="font-medium text-accent underline underline-offset-4">
            Suivant →
          </Link>
        )}
      </div>
    </nav>
  );
}
