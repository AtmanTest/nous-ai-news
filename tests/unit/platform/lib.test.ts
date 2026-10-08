import { describe, expect, it } from 'vitest';
import { formatDateFr, formatReading, pluralize } from '@/lib/format';
import { jsonError, jsonOk } from '@/lib/http';
import { first, fromSearchParams, parseIntStrict, readInt } from '@/lib/params';
import { fail, ok } from '@/lib/result';
import { escapeXml } from '@/lib/xml';

describe('[REQ-ART-01] lib/params', () => {
  it('fromSearchParams conserve la première valeur d’une clé répétée', () => {
    expect(fromSearchParams(new URLSearchParams('a=1&a=2&b=3'))).toEqual({ a: '1', b: '3' });
  });

  it('first lit une valeur simple, la première d’une liste, ou undefined', () => {
    expect(first({ a: 'x' }, 'a')).toBe('x');
    expect(first({ a: ['x', 'y'] }, 'a')).toBe('x');
    expect(first({}, 'a')).toBeUndefined();
  });

  it.each([
    ['0', 0],
    ['42', 42],
    ['999999999', 999999999],
    ['1000000000', null], // 10 chiffres : au-delà de la borne de sécurité
    ['-1', null],
    ['1.0', null],
    ['', null],
    ['abc', null],
  ])('parseIntStrict(%j) → %j', (input, expected) => {
    expect(parseIntStrict(input)).toBe(expected);
  });

  it('readInt : défaut si absent, valeur si valide, FieldError sinon', () => {
    const options = { min: 1, max: 5, fallback: 3 };
    expect(readInt({}, 'n', options)).toBe(3);
    expect(readInt({ n: '4' }, 'n', options)).toBe(4);
    expect(readInt({ n: '6' }, 'n', options)).toMatchObject({ field: 'n' });
    expect(readInt({ n: '0' }, 'n', options)).toMatchObject({ field: 'n' });
  });
});

describe('[REQ-ART-03] lib/http et lib/result', () => {
  it('jsonOk produit une réponse JSON avec le statut demandé', async () => {
    const response = jsonOk({ data: 1 }, 201, { 'X-Test': '1' });
    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-test')).toBe('1');
    expect(await response.json()).toEqual({ data: 1 });
  });

  it('jsonError respecte le format d’erreur unique { error: { code, message, details? } }', async () => {
    const withDetails = jsonError(422, 'VALIDATION_ERROR', 'invalide', [{ field: 'email', message: 'requis' }]);
    expect(withDetails.status).toBe(422);
    expect(await withDetails.json()).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'invalide', details: [{ field: 'email', message: 'requis' }] },
    });

    const withoutDetails = await jsonError(404, 'NOT_FOUND', 'absent').json();
    expect(withoutDetails).toEqual({ error: { code: 'NOT_FOUND', message: 'absent' } });
  });

  it('ok / fail construisent des Result discriminés', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(fail([{ field: 'f', message: 'm' }])).toEqual({ ok: false, errors: [{ field: 'f', message: 'm' }] });
  });
});

describe('[REQ-PLT-02] lib/xml — échappement RSS', () => {
  it('échappe les cinq caractères réservés XML', () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;');
  });

  it('échappe « & » en premier (pas de double échappement)', () => {
    expect(escapeXml('&lt;')).toBe('&amp;lt;');
  });

  it('laisse intact un texte sans caractère réservé (accents compris)', () => {
    expect(escapeXml('Évaluation des modèles')).toBe('Évaluation des modèles');
  });
});

describe('[REQ-ART-04] lib/format', () => {
  it('formatDateFr rend une date longue en français, indépendante du fuseau', () => {
    expect(formatDateFr('2026-10-06T08:00:00Z')).toBe('6 octobre 2026');
    expect(formatDateFr('2026-09-11T23:59:59Z')).toBe('11 septembre 2026');
  });

  it('formatReading', () => {
    expect(formatReading(3)).toBe('3 min de lecture');
  });

  it.each([
    [0, '0 article'],
    [1, '1 article'],
    [2, '2 articles'],
  ])('pluralize(%i) → %s', (count, expected) => {
    expect(pluralize(count, 'article')).toBe(expected);
  });

  it('pluralize accepte un pluriel irrégulier', () => {
    expect(pluralize(2, 'cheval', 'chevaux')).toBe('2 chevaux');
  });
});
