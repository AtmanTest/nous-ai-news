import { jsonOk } from '@/lib/http';
import { ARTICLES } from '@/modules/articles/data';
import pkg from '../../../../package.json';

export const dynamic = 'force-dynamic';

export function GET() {
  return jsonOk(
    {
      status: 'ok',
      version: pkg.version,
      articles: ARTICLES.length,
      timestamp: new Date().toISOString(),
    },
    200,
    { 'Cache-Control': 'no-store' },
  );
}
