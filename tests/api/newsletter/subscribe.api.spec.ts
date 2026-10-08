import { expect, test, type APIRequestContext } from '@playwright/test';
import { expectApiError } from '../../support/api';
import { emailOfLength, emailWithLocalLength, uniqueEmail } from '../../support/seed';

const URL = '/api/newsletter/subscribe';
const subscribe = (request: APIRequestContext, data: unknown) => request.post(URL, { data });

test.describe('Newsletter — POST /api/newsletter/subscribe', () => {
  test('NEW-API-001 @smoke @REQ-NEW-01 nouvelle inscription : 201 « subscribed »', async ({ request }) => {
    const email = uniqueEmail();
    const response = await subscribe(request, { email, consent: true });
    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toEqual({ data: { status: 'subscribed', email } });
  });

  test('NEW-API-002 @REQ-NEW-01 l’adresse est normalisée (trim + minuscules) dans la réponse', async ({ request }) => {
    const email = uniqueEmail('Maj');
    const response = await subscribe(request, { email: `  ${email.toUpperCase()}  `, consent: true });
    expect(response.status()).toBe(201);
    expect((await response.json()).data.email).toBe(email.toLowerCase());
  });

  test('NEW-API-003 @REQ-NEW-03 idempotence : la 2ᵉ inscription renvoie 200 « already_subscribed »', async ({
    request,
  }) => {
    const email = uniqueEmail();
    expect((await subscribe(request, { email, consent: true })).status()).toBe(201);

    const again = await subscribe(request, { email, consent: true });
    expect(again.status()).toBe(200);
    expect(await again.json()).toEqual({ data: { status: 'already_subscribed', email } });
  });

  test('NEW-API-004 @REQ-NEW-03 un doublon à la casse et aux espaces près est détecté', async ({ request }) => {
    const email = uniqueEmail();
    await subscribe(request, { email, consent: true });
    const variant = await subscribe(request, { email: `  ${email.toUpperCase()} `, consent: true });
    expect(variant.status()).toBe(200);
    expect((await variant.json()).data.status).toBe('already_subscribed');
  });

  test('NEW-API-005 @REQ-NEW-03 soumissions concurrentes : exactement une inscription, les autres sont des doublons', async ({
    request,
  }) => {
    const email = uniqueEmail();
    const responses = await Promise.all(Array.from({ length: 5 }, () => subscribe(request, { email, consent: true })));
    const statuses = responses.map((r) => r.status()).sort();
    expect(statuses).toEqual([200, 200, 200, 200, 201]);
  });

  test.describe('table de décision : email × consentement × thématiques → 422 ou succès', () => {
    // [règle, corps (sans email valide injecté pour R1/R2), champs attendus en erreur]
    const rows: Array<[string, () => Record<string, unknown>, string[]]> = [
      ['R1 tout valide + topics', () => ({ email: uniqueEmail(), consent: true, topics: ['agents', 'models'] }), []],
      ['R2 tout valide sans topics', () => ({ email: uniqueEmail(), consent: true }), []],
      ['R3 email invalide', () => ({ email: 'pas-un-email', consent: true }), ['email']],
      ['R4 email absent', () => ({ consent: true }), ['email']],
      ['R5 consentement absent', () => ({ email: uniqueEmail() }), ['consent']],
      ['R6 consentement refusé', () => ({ email: uniqueEmail(), consent: false }), ['consent']],
      ['R7 consentement non booléen (« true »)', () => ({ email: uniqueEmail(), consent: 'true' }), ['consent']],
      ['R8 thématique inconnue', () => ({ email: uniqueEmail(), consent: true, topics: ['nope'] }), ['topics']],
      ['R9 topics n’est pas une liste', () => ({ email: uniqueEmail(), consent: true, topics: 'agents' }), ['topics']],
      ['R10 email invalide + consentement refusé', () => ({ email: 'x', consent: false }), ['consent', 'email']],
      ['R11 tout invalide', () => ({ email: '', consent: false, topics: [1] }), ['consent', 'email', 'topics']],
    ];

    for (const [rule, build, expectedFields] of rows) {
      test(`NEW-API-006 @REQ-NEW-02 ${rule}`, async ({ request }) => {
        const response = await subscribe(request, build());
        if (expectedFields.length === 0) {
          expect(response.status()).toBe(201);
          return;
        }
        const body = await expectApiError(response, 422, 'VALIDATION_ERROR');
        expect(body.error.details?.map((d) => d.field).sort()).toEqual(expectedFields);
      });
    }
  });

  // NB : on envoie un Buffer car Playwright ré-encode en JSON toute chaîne non-JSON lorsque le
  // Content-Type est application/json, ce qui masquerait justement le cas testé.
  test('NEW-API-007 @REQ-NEW-02 JSON invalide : 400 INVALID_JSON', async ({ request }) => {
    const response = await request.post(URL, {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from('{ceci n’est pas du json'),
    });
    await expectApiError(response, 400, 'INVALID_JSON');
  });

  test('NEW-API-008 @REQ-NEW-02 corps vide : 400 INVALID_JSON', async ({ request }) => {
    const response = await request.post(URL, {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from(''),
    });
    await expectApiError(response, 400, 'INVALID_JSON');
  });

  test.describe('corps JSON valide mais non objet : 422 sur « body »', () => {
    for (const raw of ['[]', '"texte"', '42', 'null', 'true']) {
      test(`NEW-API-009 @REQ-NEW-02 corps ${raw}`, async ({ request }) => {
        const response = await request.post(URL, { headers: { 'Content-Type': 'application/json' }, data: raw });
        const body = await expectApiError(response, 422, 'VALIDATION_ERROR');
        expect(body.error.details?.map((d) => d.field)).toEqual(['body']);
      });
    }
  });

  test.describe('analyse des valeurs limites : longueur totale de l’e-mail (max 254)', () => {
    for (const [length, status] of [
      [253, 201],
      [254, 201],
      [255, 422],
    ] as const) {
      test(`NEW-API-010 @REQ-NEW-02 adresse de ${length} caractères → ${status}`, async ({ request }) => {
        const email = emailOfLength(length);
        expect(email).toHaveLength(length);
        expect((await subscribe(request, { email, consent: true })).status()).toBe(status);
      });
    }
  });

  test.describe('analyse des valeurs limites : partie locale (max 64)', () => {
    for (const [length, status] of [
      [63, 201],
      [64, 201],
      [65, 422],
    ] as const) {
      test(`NEW-API-011 @REQ-NEW-02 partie locale de ${length} caractères → ${status}`, async ({ request }) => {
        const email = emailWithLocalLength(length);
        expect(email.split('@')[0]).toHaveLength(length);
        expect((await subscribe(request, { email, consent: true })).status()).toBe(status);
      });
    }
  });

  test('NEW-API-012 @REQ-NEW-01 les thématiques en double sont acceptées (dédoublonnées)', async ({ request }) => {
    const response = await subscribe(request, { email: uniqueEmail(), consent: true, topics: ['agents', 'agents'] });
    expect(response.status()).toBe(201);
  });

  test('NEW-API-013 @REQ-NEW-02 mass assignment : les champs inattendus sont ignorés et non renvoyés', async ({
    request,
  }) => {
    const email = uniqueEmail();
    const response = await subscribe(request, { email, consent: true, isAdmin: true, role: 'admin' });
    expect(response.status()).toBe(201);
    expect(await response.json()).toEqual({ data: { status: 'subscribed', email } });
  });

  test('NEW-API-014 @REQ-NEW-02 charges hostiles dans l’e-mail : 422, jamais 5xx', async ({ request }) => {
    for (const email of ['<script>alert(1)</script>@x.fr', "a'; DROP TABLE users;--@x.fr", '${7*7}@x', 'a@b.fr\r\nBcc: x@y.fr']) {
      const response = await subscribe(request, { email, consent: true });
      expect(response.status(), email).toBe(422);
    }
  });

  for (const method of ['get', 'put', 'delete'] as const) {
    test(`NEW-API-015 @REQ-NEW-01 méthode non autorisée : ${method.toUpperCase()} → 405`, async ({ request }) => {
      const response = await request[method](URL);
      expect(response.status()).toBe(405);
    });
  }
});
