import type { FieldError } from './result';

export function jsonOk(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers });
}

/**
 * Format d'erreur unique pour toute l'API :
 * { "error": { "code": "...", "message": "...", "details": [{ "field", "message" }] } }
 */
export function jsonError(status: number, code: string, message: string, details?: FieldError[]): Response {
  return Response.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}
