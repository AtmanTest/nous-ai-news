import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE, parseListParams } from '@/modules/articles/validation';

const fieldsOf = (result: ReturnType<typeof parseListParams>) => (result.ok ? [] : result.errors.map((e) => e.field));

describe('[REQ-ART-01] parseListParams — valeurs par défaut', () => {
  it('applique page=1, pageSize=9, sort=newest sans catégorie quand rien n’est fourni', () => {
    const result = parseListParams({});
    expect(result).toEqual({
      ok: true,
      value: { page: 1, pageSize: DEFAULT_PAGE_SIZE, category: undefined, sort: 'newest' },
    });
  });
});

describe('[REQ-ART-01] parseListParams — analyse des valeurs limites : page', () => {
  it.each([
    ['0', false],
    ['1', true],
    ['2', true],
    [String(MAX_PAGE), true],
    [String(MAX_PAGE + 1), false],
  ])('page=%s → valide : %s', (page, valid) => {
    expect(parseListParams({ page }).ok).toBe(valid);
  });
});

describe('[REQ-ART-01] parseListParams — analyse des valeurs limites : pageSize', () => {
  it.each([
    ['0', false],
    ['1', true],
    ['9', true],
    [String(MAX_PAGE_SIZE), true],
    [String(MAX_PAGE_SIZE + 1), false],
  ])('pageSize=%s → valide : %s', (pageSize, valid) => {
    expect(parseListParams({ pageSize }).ok).toBe(valid);
  });
});

describe('[REQ-ART-01] parseListParams — partitions d’équivalence invalides (entiers)', () => {
  it.each(['abc', '-1', '1.5', '', ' 1', '1 ', '1e3', '0x10', '１２'])('page=%j est rejeté', (page) => {
    expect(fieldsOf(parseListParams({ page }))).toEqual(['page']);
  });

  it('n’accepte que la première valeur d’un paramètre répété', () => {
    expect(parseListParams({ page: ['2', 'abc'] })).toMatchObject({ ok: true, value: { page: 2 } });
  });
});

describe('[REQ-ART-02] parseListParams — catégorie et tri', () => {
  it.each(['models', 'research', 'open-source', 'policy', 'business', 'agents'])('accepte la thématique %s', (category) => {
    expect(parseListParams({ category })).toMatchObject({ ok: true, value: { category } });
  });

  it.each(['unknown', 'MODELS', '', 'models ', '../etc/passwd'])('rejette la thématique %j', (category) => {
    expect(fieldsOf(parseListParams({ category }))).toEqual(['category']);
  });

  it.each(['newest', 'oldest'])('accepte sort=%s', (sort) => {
    expect(parseListParams({ sort })).toMatchObject({ ok: true, value: { sort } });
  });

  it.each(['asc', 'NEWEST', '', 'random'])('rejette sort=%j', (sort) => {
    expect(fieldsOf(parseListParams({ sort }))).toEqual(['sort']);
  });
});

describe('[REQ-ART-01] parseListParams — cumul d’erreurs', () => {
  it('signale toutes les erreurs en une seule réponse', () => {
    const result = parseListParams({ page: '0', pageSize: '51', category: 'x', sort: 'y' });
    expect(fieldsOf(result).sort()).toEqual(['category', 'page', 'pageSize', 'sort']);
  });
});
