import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  parseSearchParams,
} from '@/modules/search/validation';

const fieldsOf = (result: ReturnType<typeof parseSearchParams>) => (result.ok ? [] : result.errors.map((e) => e.field));

describe('[REQ-SRC-02] parseSearchParams — analyse des valeurs limites : longueur de q', () => {
  it.each([
    [MIN_QUERY_LENGTH - 1, false],
    [MIN_QUERY_LENGTH, true],
    [MIN_QUERY_LENGTH + 1, true],
    [MAX_QUERY_LENGTH - 1, true],
    [MAX_QUERY_LENGTH, true],
    [MAX_QUERY_LENGTH + 1, false],
  ])('q de %i caractères → valide : %s', (length, valid) => {
    expect(parseSearchParams({ q: 'a'.repeat(length) }).ok).toBe(valid);
  });
});

describe('[REQ-SRC-02] parseSearchParams — partitions d’équivalence', () => {
  it('rejette l’absence de q', () => {
    expect(fieldsOf(parseSearchParams({}))).toEqual(['q']);
  });

  it.each(['', ' ', '   ', ' a ', '\t\n'])('rejette la requête vide ou trop courte après trim : %j', (q) => {
    expect(fieldsOf(parseSearchParams({ q }))).toEqual(['q']);
  });

  it('retire les espaces autour de la requête', () => {
    expect(parseSearchParams({ q: '  agents  ' })).toMatchObject({ ok: true, value: { q: 'agents' } });
  });

  it('accepte les caractères spéciaux et unicode (traités comme du texte)', () => {
    expect(parseSearchParams({ q: '<script>alert(1)</script>' }).ok).toBe(true);
    expect(parseSearchParams({ q: "l'évaluation 日本語 🚀" }).ok).toBe(true);
  });
});

describe('[REQ-SRC-02] parseSearchParams — limit et catégorie', () => {
  it('applique la limite par défaut', () => {
    expect(parseSearchParams({ q: 'ia' })).toMatchObject({ ok: true, value: { limit: DEFAULT_LIMIT } });
  });

  it.each([
    ['0', false],
    ['1', true],
    [String(MAX_LIMIT), true],
    [String(MAX_LIMIT + 1), false],
    ['abc', false],
    ['-5', false],
  ])('limit=%s → valide : %s', (limit, valid) => {
    expect(parseSearchParams({ q: 'ia', limit }).ok).toBe(valid);
  });

  it('valide la catégorie', () => {
    expect(parseSearchParams({ q: 'ia', category: 'agents' }).ok).toBe(true);
    expect(fieldsOf(parseSearchParams({ q: 'ia', category: 'nope' }))).toEqual(['category']);
  });

  it('cumule les erreurs de plusieurs paramètres', () => {
    expect(fieldsOf(parseSearchParams({ q: 'a', category: 'nope', limit: '0' })).sort()).toEqual([
      'category',
      'limit',
      'q',
    ]);
  });
});
