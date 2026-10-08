import type { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/http';
import { fromSearchParams } from '@/lib/params';
import { searchArticles } from '@/modules/search/service';
import { parseSearchParams } from '@/modules/search/validation';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const parsed = parseSearchParams(fromSearchParams(request.nextUrl.searchParams));
  if (!parsed.ok) {
    return jsonError(400, 'INVALID_PARAMETER', 'Un ou plusieurs paramètres sont invalides.', parsed.errors);
  }
  const { results, total } = searchArticles(parsed.value);
  return jsonOk({ data: results, meta: { query: parsed.value.q, total, returned: results.length } });
}
