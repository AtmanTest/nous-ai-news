import { fail, ok, type FieldError, type Result } from '@/lib/result';
import { first, readInt, type RawParams } from '@/lib/params';
import { isCategorySlug, type CategorySlug } from '@/modules/topics/topics';

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export interface SearchParams {
  /** Requête nettoyée (trim), longueur comprise entre MIN et MAX. */
  q: string;
  category?: CategorySlug;
  limit: number;
}

export function parseSearchParams(raw: RawParams): Result<SearchParams> {
  const errors: FieldError[] = [];

  const rawQuery = first(raw, 'q');
  const q = rawQuery?.trim();
  if (q === undefined) {
    errors.push({ field: 'q', message: 'Le paramètre q est requis.' });
  } else if (q.length < MIN_QUERY_LENGTH) {
    errors.push({ field: 'q', message: `La recherche doit contenir au moins ${MIN_QUERY_LENGTH} caractères.` });
  } else if (q.length > MAX_QUERY_LENGTH) {
    errors.push({ field: 'q', message: `La recherche ne doit pas dépasser ${MAX_QUERY_LENGTH} caractères.` });
  }

  const category = first(raw, 'category');
  if (category !== undefined && !isCategorySlug(category)) {
    errors.push({ field: 'category', message: 'category doit être un identifiant de thématique connu.' });
  }

  const limit = readInt(raw, 'limit', { min: 1, max: MAX_LIMIT, fallback: DEFAULT_LIMIT });
  if (typeof limit !== 'number') errors.push(limit);

  if (errors.length > 0) return fail(errors);

  return ok({
    q: q as string,
    category: category === undefined ? undefined : (category as CategorySlug),
    limit: limit as number,
  });
}
