import { describe, expect, it } from 'vitest';
import { ARTICLES } from '@/modules/articles/data';
import { listTopicsWithCounts } from '@/modules/topics/service';
import { CATEGORY_SLUGS, TOPICS, getTopic, getTopicLabel, isCategorySlug } from '@/modules/topics/topics';
import { SEED } from '../../support/seed';

describe('[REQ-TOP-01] listTopicsWithCounts', () => {
  it('retourne toutes les thématiques dans l’ordre de déclaration', () => {
    expect(listTopicsWithCounts().map((t) => t.slug)).toEqual(SEED.categories);
  });

  it('la somme des compteurs égale le nombre total d’articles (conservation)', () => {
    const total = listTopicsWithCounts().reduce((sum, topic) => sum + topic.count, 0);
    expect(total).toBe(ARTICLES.length);
  });

  it('chaque thématique du jeu de démonstration compte le nombre attendu d’articles', () => {
    expect(listTopicsWithCounts().every((topic) => topic.count === SEED.perCategory)).toBe(true);
  });

  it('retourne 0 pour une thématique sans article', () => {
    const counts = listTopicsWithCounts([{ category: 'agents' }]);
    expect(counts.find((t) => t.slug === 'agents')?.count).toBe(1);
    expect(counts.find((t) => t.slug === 'models')?.count).toBe(0);
  });
});

describe('[REQ-TOP-02] helpers de thématiques', () => {
  it('isCategorySlug accepte les slugs connus uniquement', () => {
    expect(CATEGORY_SLUGS.every((slug) => isCategorySlug(slug))).toBe(true);
    for (const invalid of ['', 'unknown', 'MODELS', 'models ', null, undefined, 42, {}]) {
      expect(isCategorySlug(invalid)).toBe(false);
    }
  });

  it('getTopic retrouve une thématique ou retourne undefined', () => {
    expect(getTopic('policy')?.label).toBe('Régulation');
    expect(getTopic('inconnue')).toBeUndefined();
  });

  it('getTopicLabel retourne le libellé affiché', () => {
    expect(getTopicLabel('agents')).toBe('Agents IA');
  });

  it('les libellés et slugs de thématiques sont uniques et non vides', () => {
    expect(new Set(TOPICS.map((t) => t.slug)).size).toBe(TOPICS.length);
    expect(new Set(TOPICS.map((t) => t.label)).size).toBe(TOPICS.length);
    expect(TOPICS.every((t) => t.label.length > 0 && t.description.length > 0)).toBe(true);
  });
});
