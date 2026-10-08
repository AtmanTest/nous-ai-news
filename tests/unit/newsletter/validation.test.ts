import { describe, expect, it } from 'vitest';
import {
  MAX_EMAIL_LENGTH,
  MAX_LOCAL_PART_LENGTH,
  normalizeEmail,
  validateEmail,
  validateSubscription,
} from '@/modules/newsletter/validation';
import { emailOfLength } from '../../support/seed';

const fieldsOf = (input: unknown) => {
  const result = validateSubscription(input);
  return result.ok ? [] : result.errors.map((e) => e.field).sort();
};

describe('[REQ-NEW-02] validateSubscription — table de décision (email × consentement × thématiques)', () => {
  // Chaque ligne = une règle de la table de décision ; la dernière colonne est l'ensemble des champs en erreur.
  it.each([
    ['R1 : tout valide', { email: 'a@b.fr', consent: true, topics: ['agents'] }, []],
    ['R2 : tout valide, sans topics', { email: 'a@b.fr', consent: true }, []],
    ['R3 : email invalide', { email: 'pas-un-email', consent: true }, ['email']],
    ['R4 : consentement absent', { email: 'a@b.fr' }, ['consent']],
    ['R5 : consentement refusé', { email: 'a@b.fr', consent: false }, ['consent']],
    ['R6 : consentement non booléen', { email: 'a@b.fr', consent: 'true' }, ['consent']],
    ['R7 : thématique inconnue', { email: 'a@b.fr', consent: true, topics: ['nope'] }, ['topics']],
    ['R8 : topics n’est pas une liste', { email: 'a@b.fr', consent: true, topics: 'agents' }, ['topics']],
    ['R9 : email invalide + pas de consentement', { email: 'x', consent: false }, ['consent', 'email']],
    ['R10 : tout invalide', { email: '', consent: false, topics: [1] }, ['consent', 'email', 'topics']],
  ])('%s', (_rule, input, expectedFields) => {
    expect(fieldsOf(input)).toEqual(expectedFields);
  });
});

describe('[REQ-NEW-02] validateSubscription — corps de requête non objet', () => {
  it.each([null, undefined, 42, 'texte', true, []])('rejette %j avec une erreur sur "body"', (input) => {
    expect(fieldsOf(input)).toEqual(['body']);
  });
});

describe('[REQ-NEW-02] validateEmail — partitions d’équivalence', () => {
  it.each(['a@b.fr', 'prenom.nom+tag@sous.domaine.org', 'UPPER@CASE.COM', 'x@y.co'])('accepte %s', (email) => {
    expect(validateEmail(email)).toBeNull();
  });

  it.each([
    '',
    '   ',
    'sans-arobase',
    '@domaine.fr',
    'local@',
    'local@domaine',
    'local@domaine.',
    'a b@c.fr',
    'a@b@c.fr',
    'a@b.c', // TLD d'un seul caractère
  ])('rejette %j', (email) => {
    expect(validateEmail(email)).not.toBeNull();
  });

  it.each([undefined, null, 42, {}, []])('rejette le type non-chaîne %j', (value) => {
    expect(validateEmail(value)?.field).toBe('email');
  });
});

describe('[REQ-NEW-02] validateEmail — sécurité : caractères interdits dans la partie locale', () => {
  // Défaut DEF-001 : `<script>…</script>@x.fr` était accepté par la première version du validateur.
  it.each([
    '<script>alert(1)</script>@x.fr',
    'a"b@x.fr',
    'a(b)@x.fr',
    'a,b@x.fr',
    'a;b@x.fr',
    'a:b@x.fr',
    'a\\b@x.fr',
    'a[b]@x.fr',
    'a b@x.fr',
    'é@x.fr', // adresses internationalisées : hors périmètre, refusées
  ])('rejette %j', (email) => {
    expect(validateEmail(email)?.field).toBe('email');
  });

  it.each(["o'brien@x.fr", 'a+tag@x.fr', 'a_b-c@x.fr', 'a.b.c@x.fr', '{a}@x.fr'])('accepte le caractère atext dans %j', (email) => {
    expect(validateEmail(email)).toBeNull();
  });

  it.each(['.a@x.fr', 'a.@x.fr', 'a..b@x.fr'])('rejette les points mal placés dans %j', (email) => {
    expect(validateEmail(email)).not.toBeNull();
  });
});

describe('[REQ-NEW-02] validateEmail — domaine', () => {
  it.each(['a@-x.fr', 'a@x-.fr', 'a@x..fr', 'a@.fr', 'a@x.123', 'a@x.f', 'a@x_y.fr', 'a@x y.fr'])('rejette %j', (email) => {
    expect(validateEmail(email)).not.toBeNull();
  });

  it.each(['a@x.fr', 'a@sub-domaine.example.co.uk', 'a@x.xn--p1ai', 'a@1x.org'])('accepte %j', (email) => {
    expect(validateEmail(email)).toBeNull();
  });

  it.each([
    [63, true],
    [64, false],
  ])('label DNS de %i caractères → valide : %s (limite RFC 1035)', (length, valid) => {
    expect(validateEmail(`a@${'d'.repeat(length)}.fr`) === null).toBe(valid);
  });
});

describe('[REQ-NEW-02] validateEmail — analyse des valeurs limites', () => {
  it.each([
    [MAX_EMAIL_LENGTH - 1, true],
    [MAX_EMAIL_LENGTH, true],
    [MAX_EMAIL_LENGTH + 1, false],
  ])('adresse de %i caractères → valide : %s', (length, valid) => {
    const email = emailOfLength(length);
    expect(email).toHaveLength(length);
    expect(validateEmail(email) === null).toBe(valid);
  });

  it.each([
    [MAX_LOCAL_PART_LENGTH - 1, true],
    [MAX_LOCAL_PART_LENGTH, true],
    [MAX_LOCAL_PART_LENGTH + 1, false],
  ])('partie locale de %i caractères → valide : %s', (length, valid) => {
    expect(validateEmail(`${'a'.repeat(length)}@example.com`) === null).toBe(valid);
  });
});

describe('[REQ-NEW-03] normalisation', () => {
  it('normalizeEmail retire les espaces et passe en minuscules', () => {
    expect(normalizeEmail('  Prenom.NOM@Example.COM ')).toBe('prenom.nom@example.com');
  });

  it('la valeur validée est normalisée et les thématiques dédoublonnées', () => {
    const result = validateSubscription({
      email: '  USER@Example.com ',
      consent: true,
      topics: ['agents', 'models', 'agents'],
    });
    expect(result).toEqual({
      ok: true,
      value: { email: 'user@example.com', consent: true, topics: ['agents', 'models'] },
    });
  });
});
