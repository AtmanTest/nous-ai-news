import { jsonError, jsonOk } from '@/lib/http';
import { getArticleBySlug } from '@/modules/articles/service';

export const dynamic = 'force-dynamic';

export function GET(_request: Request, { params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) {
    return jsonError(404, 'NOT_FOUND', 'Article introuvable.');
  }
  return jsonOk({ data: article });
}
