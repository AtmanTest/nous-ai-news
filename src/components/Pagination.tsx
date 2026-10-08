import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
}

function hrefFor(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
      <div className="w-32">
        {page > 1 && (
          <Link
            href={hrefFor(basePath, page - 1)}
            rel="prev"
            data-testid="pagination-prev"
            className="font-medium text-accent underline underline-offset-4"
          >
            ← Précédent
          </Link>
        )}
      </div>
      <p data-testid="pagination-status" className="text-gray-700">
        Page {page} sur {totalPages}
      </p>
      <div className="w-32 text-right">
        {page < totalPages && (
          <Link
            href={hrefFor(basePath, page + 1)}
            rel="next"
            data-testid="pagination-next"
            className="font-medium text-accent underline underline-offset-4"
          >
            Suivant →
          </Link>
        )}
      </div>
    </nav>
  );
}
