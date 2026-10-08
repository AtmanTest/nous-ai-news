import { jsonError, jsonOk } from '@/lib/http';
import { subscribe } from '@/modules/newsletter/service';
import { validateSubscription } from '@/modules/newsletter/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, 'INVALID_JSON', 'Le corps de la requête doit être un JSON valide.');
  }

  const parsed = validateSubscription(payload);
  if (!parsed.ok) {
    return jsonError(422, 'VALIDATION_ERROR', 'Les données fournies sont invalides.', parsed.errors);
  }

  const { status, email } = subscribe(parsed.value);
  return jsonOk({ data: { status, email } }, status === 'subscribed' ? 201 : 200);
}
