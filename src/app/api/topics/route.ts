import { jsonOk } from '@/lib/http';
import { listTopicsWithCounts } from '@/modules/topics/service';

export const dynamic = 'force-dynamic';

export function GET() {
  return jsonOk({ data: listTopicsWithCounts() });
}
