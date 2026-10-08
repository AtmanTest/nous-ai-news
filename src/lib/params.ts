import type { FieldError } from './result';

export type RawParams = Record<string, string | string[] | undefined>;

/** Convertit des URLSearchParams en objet simple (première valeur retenue pour une clé répétée). */
export function fromSearchParams(searchParams: URLSearchParams): RawParams {
  const out: RawParams = {};
  searchParams.forEach((value, key) => {
    if (!(key in out)) out[key] = value;
  });
  return out;
}

export function first(raw: RawParams, key: string): string | undefined {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Entier décimal strict : pas de signe, pas de décimale, pas d'espace, 9 chiffres maximum. */
export function parseIntStrict(value: string): number | null {
  return /^\d{1,9}$/.test(value) ? Number(value) : null;
}

export interface IntOptions {
  min: number;
  max: number;
  fallback: number;
}

/**
 * Lit un paramètre entier borné.
 * - absent            → valeur par défaut
 * - présent et valide → valeur
 * - présent et invalide (y compris chaîne vide) → FieldError
 */
export function readInt(raw: RawParams, key: string, { min, max, fallback }: IntOptions): number | FieldError {
  const value = first(raw, key);
  if (value === undefined) return fallback;
  const parsed = parseIntStrict(value);
  if (parsed === null || parsed < min || parsed > max) {
    return { field: key, message: `${key} doit être un entier compris entre ${min} et ${max}.` };
  }
  return parsed;
}
