import { describe, expect, it } from 'vitest';
import type { RawItem } from '@/modules/ingest/feed';
import { canonicalUrl, classify, isAiRelated, normalizeItem, shortHash, slugify, truncate, type Source } from '@/modules/ingest/normalize';
import { isCategorySlug } from '@/modules/topics/topics';

const NOW = new Date('2026-10-08T12:00:00Z');
const AI_SOURCE: Source = { id: 's', name: 'Source IA', url: 'https://exemple.fr/feed', lang: 'fr', aiOnly: true };
const GENERAL_SOURCE: Source = { ...AI_SOURCE, name: 'Généraliste', aiOnly: false };

function item(overrides: Partial<RawItem> = {}): RawItem {
  return {
    title: 'OpenAI lance un nouveau modèle de raisonnement',
    link: 'https://exemple.fr/article?utm_source=rss#haut',
    summary: 'Le laboratoire présente une nouvelle version.',
    published: '2026-10-07T08:00:00Z',
    ...overrides,
  };
}

describe('[REQ-ING-02] canonicalUrl', () => {
  it.each([
    ['https://Exemple.FR/a/?utm_source=x&utm_medium=y#frag', 'https://exemple.fr/a'],
    ['https://exemple.fr/a?id=3&fbclid=abc', 'https://exemple.fr/a?id=3'],
    ['http://exemple.fr/a/', 'http://exemple.fr/a'],
  ])('normalise %s', (input, expected) => {
    expect(canonicalUrl(input)).toBe(expected);
  });

  it.each(['', 'pas une url', 'javascript:alert(1)', 'ftp://exemple.fr/a', 'data:text/html,x'])('rejette %j', (input) => {
    expect(canonicalUrl(input)).toBe('');
  });
});

describe('[REQ-ING-02] slugify / shortHash / truncate', () => {
  it('slugify retire accents, ponctuation et bords', () => {
    expect(slugify('  Été : l’IA — « grand » !  ')).toBe('ete-l-ia-grand');
  });

  it('slugify borne la longueur sans tiret final', () => {
    const slug = slugify('mot '.repeat(50), 20);
    expect(slug.length).toBeLessThanOrEqual(20);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('shortHash est stable et distingue deux entrées', () => {
    expect(shortHash('a')).toBe(shortHash('a'));
    expect(shortHash('a')).not.toBe(shortHash('b'));
    expect(shortHash('a')).toHaveLength(7);
  });

  it('truncate respecte la borne (valeurs limites 299/300/301)', () => {
    expect(truncate('a'.repeat(300), 300)).toHaveLength(300);
    expect(truncate('a'.repeat(299), 300)).toHaveLength(299);
    expect(truncate('a '.repeat(200), 300).length).toBeLessThanOrEqual(301);
    expect(truncate('a '.repeat(200), 300).endsWith('…')).toBe(true);
  });
});

describe('[REQ-ING-02] isAiRelated / classify', () => {
  it.each([
    ['Mistral lève des fonds', true],
    ['Nouvelle intelligence artificielle générative', true],
    ['Le prix des tomates en baisse', false],
    ['Un MAIL important', false],
  ])('isAiRelated(%j) = %s', (text, expected) => {
    expect(isAiRelated(text)).toBe(expected);
  });

  it.each([
    ['Le règlement AI Act entre en vigueur', 'policy'],
    ['Un agent autonome réserve vos vols', 'agents'],
    ['Des poids ouverts publiés sur Hugging Face', 'open-source'],
    ['Une étude montre des limites', 'research'],
    ['Une startup lève 2 milliards', 'business'],
    ['Texte sans rapport', 'models'],
  ])('classify(%j) = %s', (text, expected) => {
    expect(classify(text)).toBe(expected);
  });
});

describe('[REQ-ING-02] normalizeItem', () => {
  it('produit un article valide', () => {
    const article = normalizeItem(item(), AI_SOURCE, { now: NOW });
    expect(article).not.toBeNull();
    expect(article).toMatchObject({
      sourceUrl: 'https://exemple.fr/article',
      source: 'Source IA',
      publishedAt: '2026-10-07T08:00:00.000Z',
      readingMinutes: 1,
    });
    expect(article?.slug).toMatch(/^[a-z0-9-]+$/);
    expect(isCategorySlug(article?.category)).toBe(true);
    expect(article?.body).toEqual([article?.summary]);
  });

  it('ramène une date future à « maintenant »', () => {
    expect(normalizeItem(item({ published: '2027-01-01T00:00:00Z' }), AI_SOURCE, { now: NOW })?.publishedAt).toBe(NOW.toISOString());
  });

  it.each([
    ['date invalide', { published: 'hier' }],
    ['lien absent', { link: '' }],
    ['lien dangereux', { link: 'javascript:alert(1)' }],
    ['titre trop court (7)', { title: 'Court !!' .slice(0, 7) }],
  ])('rejette : %s', (_label, overrides) => {
    expect(normalizeItem(item(overrides), AI_SOURCE, { now: NOW })).toBeNull();
  });

  it('accepte un titre de 8 caractères (borne)', () => {
    expect(normalizeItem(item({ title: '12345678' }), AI_SOURCE, { now: NOW })).not.toBeNull();
  });

  it('filtre les flux généralistes hors sujet mais pas les flux IA', () => {
    const off = item({ title: 'Le marathon de Paris bat des records', summary: 'Course à pied.' });
    expect(normalizeItem(off, GENERAL_SOURCE, { now: NOW })).toBeNull();
    expect(normalizeItem(off, AI_SOURCE, { now: NOW })).not.toBeNull();
  });

  it('tronque l’extrait à 300 caractères et utilise le titre si l’extrait est vide', () => {
    expect(normalizeItem(item({ summary: 'mot '.repeat(200) }), AI_SOURCE, { now: NOW })?.summary.length).toBeLessThanOrEqual(301);
    expect(normalizeItem(item({ summary: '' }), AI_SOURCE, { now: NOW })?.summary).toBe(item().title);
  });

  it('calcule la durée de lecture à partir de l’extrait', () => {
    expect(normalizeItem(item({ summary: 'mot '.repeat(450) }), AI_SOURCE, { now: NOW })?.readingMinutes).toBe(3);
  });

  it('est déterministe : même entrée, même identifiant', () => {
    expect(normalizeItem(item(), AI_SOURCE, { now: NOW })?.id).toBe(normalizeItem(item(), AI_SOURCE, { now: NOW })?.id);
  });
});
