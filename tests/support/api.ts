import { expect, type APIResponse } from '@playwright/test';

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: ApiFieldError[] };
}

/** Vérifie le contrat d'erreur unique de l'API et retourne le corps pour des assertions complémentaires. */
export async function expectApiError(response: APIResponse, status: number, code: string): Promise<ApiErrorBody> {
  expect(response.status()).toBe(status);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = (await response.json()) as ApiErrorBody;
  expect(body.error.code).toBe(code);
  expect(typeof body.error.message).toBe('string');
  expect(body.error.message.length).toBeGreaterThan(0);
  return body;
}

export const ARTICLE_SUMMARY_KEYS = [
  'category',
  'id',
  'publishedAt',
  'readingMinutes',
  'slug',
  'source',
  'summary',
  'tags',
  'title',
];
