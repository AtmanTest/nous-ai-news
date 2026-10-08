import type { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/http';
import { fromSearchParams } from '@/lib/params';
import { listArticles } from '@/modules/articles/service';
import { parseListParams } from '@/modules/articles/validation';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const parsed = parseListParams(fromSearchParams(request.nextUrl.searchParams));
  if (!parsed.ok) {
    return jsonError(400, 'INVALID_PARAMETER', 'Un ou plusieurs paramètres sont invalides.', parsed.errors);
  }
  const { items, meta } = listArticles(parsed.value);
  return jsonOk({ data: items, meta });
}
