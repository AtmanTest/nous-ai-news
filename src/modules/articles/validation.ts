import { fail, ok, type FieldError, type Result } from '@/lib/result';
import { first, readInt, type RawParams } from '@/lib/params';
import { isCategorySlug } from '@/modules/topics/topics';
import type { ListParams, SortOrder } from './types';

export const DEFAULT_PAGE_SIZE = 9;
export const MAX_PAGE_SIZE = 50;
export const MAX_PAGE = 1_000_000;
export const SORT_ORDERS: readonly SortOrder[] = ['newest', 'oldest'];

/**
 * Valide les paramètres de listing. Toutes les erreurs sont collectées (pas seulement la première).
 * Règle : un paramètre absent prend sa valeur par défaut ; un paramètre présent doit être valide.
 */
export function parseListParams(raw: RawParams): Result<ListParams> {
  const errors: FieldError[] = [];

  const page = readInt(raw, 'page', { min: 1, max: MAX_PAGE, fallback: 1 });
  if (typeof page !== 'number') errors.push(page);

  const pageSize = readInt(raw, 'pageSize', { min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE });
  if (typeof pageSize !== 'number') errors.push(pageSize);

  const category = first(raw, 'category');
  if (category !== undefined && !isCategorySlug(category)) {
    errors.push({ field: 'category', message: 'category doit être un identifiant de thématique connu.' });
  }

  const sort = first(raw, 'sort');
  if (sort !== undefined && !SORT_ORDERS.includes(sort as SortOrder)) {
    errors.push({ field: 'sort', message: `sort doit valoir ${SORT_ORDERS.join(' ou ')}.` });
  }

  if (errors.length > 0) return fail(errors);

  return ok({
    page: page as number,
    pageSize: pageSize as number,
    category: category === undefined ? undefined : (category as ListParams['category']),
    sort: (sort as SortOrder | undefined) ?? 'newest',
  });
}
