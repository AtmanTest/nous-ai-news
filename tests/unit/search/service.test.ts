import { describe, expect, it } from 'vitest';
import { ARTICLES } from '@/modules/articles/data';
import type { Article } from '@/modules/articles/types';
import { normalize, searchArticles, tokenize, WEIGHTS } from '@/modules/search/service';

const search = (q: string, extra: { category?: Article['category']; limit?: number } = {}) =>
  searchArticles({ q, limit: 50, ...extra });

const slugs = (q: string, extra: Parameters<typeof search>[1] = {}) => search(q, extra).results.map((r) => r.slug);

function fakeArticle(overrides: Partial<Article> & Pick<Article, 'slug'>): Article {
  return {
    id: overrides.slug,
    title: 'titre',
    summary: 'résumé',
    body: ['corps'],
    category: 'models',
    tags: [],
    source: 'test',
    publishedAt: '2026-01-01T00:00:00Z',
    readingMinutes: 1,
    ...overrides,
  };
}

describe('[REQ-SRC-01] normalize / tokenize', () => {
  it.each([
    ['Évaluation', 'evaluation'],
    ['  MODÈLES   ouverts ', 'modeles ouverts'],
    ['Œuvre', 'œuvre'],
    ['naïve café', 'naive cafe'],
    ['', ''],
  ])('normalize(%j) → %j', (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it('tokenize supprime les doublons et ignore les espaces multiples', () => {
    expect(tokenize('Agents  agents CODAGE')).toEqual(['agents', 'codage']);
  });

  it('tokenize d’une chaîne vide ou d’espaces donne une liste vide', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('[REQ-SRC-01] searchArticles — partitions d’équivalence', () => {
  it('trouve un article par un mot unique de son titre', () => {
    expect(slugs('interpretabilite')).toEqual(['interpretabilite-circuits-internes']);
  });

  it('est insensible à la casse', () => {
    expect(slugs('QUANTIFICATION')).toEqual(slugs('quantification'));
    expect(slugs('quantification')).toContain('inference-locale-materiel-grand-public');
  });

  it('est insensible aux accents dans les deux sens', () => {
    expect(slugs('modeles')).toEqual(slugs('modèles'));
    expect(slugs('evaluation')).toEqual(slugs('évaluation'));
    expect(slugs('evaluation').length).toBeGreaterThan(3);
  });

  it('trouve par un tag, un résumé ou un mot du corps', () => {
    expect(slugs('multimodal')).toContain('modeles-multimodaux-video'); // tag
    expect(slugs('tests d’intrusion')).toContain('audits-independants-modeles-avances'); // résumé
    expect(slugs('reproductibles')).toContain('outils-evaluation-ouverts'); // résumé
    expect(slugs('reproductibilite')).toContain('evaluation-contamination-benchmarks'); // corps
  });

  it('retourne une liste vide, sans erreur, si rien ne correspond', () => {
    expect(search('zzzzqqqq')).toEqual({ results: [], total: 0 });
  });

  it('ignore une requête composée uniquement d’espaces', () => {
    expect(search('    ')).toEqual({ results: [], total: 0 });
  });

  it('traite les caractères spéciaux comme du texte (pas d’interprétation regex)', () => {
    expect(search('.*').total).toBe(0);
    expect(search('(agents').total).toBe(0);
    expect(search('<script>').total).toBe(0);
  });
});

describe('[REQ-SRC-01] searchArticles — sémantique ET', () => {
  it('chaque terme supplémentaire restreint (jamais n’élargit) les résultats', () => {
    const one = slugs('agents');
    const two = slugs('agents codage');
    expect(two.length).toBeLessThan(one.length);
    expect(two.every((slug) => one.includes(slug))).toBe(true);
    expect(two).toEqual(['agents-codage-revue-humaine']);
  });

  it('exclut un article dont un seul des termes manque', () => {
    expect(slugs('agents quantification')).toEqual([]);
  });

  it('l’ordre des termes n’a pas d’influence sur l’ensemble des résultats', () => {
    expect(new Set(slugs('agents codage'))).toEqual(new Set(slugs('codage agents')));
  });
});

describe('[REQ-SRC-01] searchArticles — filtre et limite', () => {
  it('restreint les résultats à la thématique demandée', () => {
    const results = search('evaluation', { category: 'agents' }).results;
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.category === 'agents')).toBe(true);
  });

  it('limit tronque les résultats mais total reflète toutes les correspondances', () => {
    const all = search('evaluation');
    const limited = search('evaluation', { limit: 2 });
    expect(limited.results).toHaveLength(2);
    expect(limited.total).toBe(all.total);
    expect(limited.results.map((r) => r.slug)).toEqual(all.results.slice(0, 2).map((r) => r.slug));
  });

  it('n’expose pas le corps des articles', () => {
    expect(search('agents').results.every((r) => !('body' in r))).toBe(true);
  });
});

describe('[REQ-SRC-03] searchArticles — tri par pertinence', () => {
  it('trie par score décroissant', () => {
    const scores = search('evaluation').results.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(scores.every((s) => s > 0)).toBe(true);
  });

  it('place l’article dont le titre contient le terme avant ceux qui ne le mentionnent qu’ailleurs', () => {
    const results = search('evaluation').results;
    const firstWithoutTitleMatch = results.findIndex((r) => !normalize(r.title).includes('evaluation'));
    const lastWithTitleMatch = results.map((r) => normalize(r.title).includes('evaluation')).lastIndexOf(true);
    expect(lastWithTitleMatch).toBeLessThan(firstWithoutTitleMatch);
  });

  it('applique les pondérations titre > tags > résumé > corps', () => {
    expect(WEIGHTS.title).toBeGreaterThan(WEIGHTS.tags);
    expect(WEIGHTS.tags).toBeGreaterThan(WEIGHTS.summary);
    expect(WEIGHTS.summary).toBeGreaterThan(WEIGHTS.body);

    const source = [
      fakeArticle({ slug: 'dans-corps', body: ['le mot cible ici'] }),
      fakeArticle({ slug: 'dans-titre', title: 'cible' }),
      fakeArticle({ slug: 'dans-tags', tags: ['cible'] }),
      fakeArticle({ slug: 'dans-resume', summary: 'cible' }),
    ];
    const ranked = searchArticles({ q: 'cible', limit: 10 }, source).results;
    expect(ranked.map((r) => r.slug)).toEqual(['dans-titre', 'dans-tags', 'dans-resume', 'dans-corps']);
    expect(ranked.map((r) => r.score)).toEqual([WEIGHTS.title, WEIGHTS.tags, WEIGHTS.summary, WEIGHTS.body]);
  });

  it('départage les scores égaux par date décroissante puis par slug', () => {
    const source = [
      fakeArticle({ slug: 'b', title: 'cible', publishedAt: '2026-02-01T00:00:00Z' }),
      fakeArticle({ slug: 'a', title: 'cible', publishedAt: '2026-02-01T00:00:00Z' }),
      fakeArticle({ slug: 'c', title: 'cible', publishedAt: '2026-03-01T00:00:00Z' }),
    ];
    expect(searchArticles({ q: 'cible', limit: 10 }, source).results.map((r) => r.slug)).toEqual(['c', 'a', 'b']);
  });

  it('chaque article du jeu de données est retrouvable par son propre slug-titre', () => {
    for (const article of ARTICLES) {
      expect(slugs(article.title)).toContain(article.slug);
    }
  });
});
