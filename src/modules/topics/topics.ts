export const TOPICS = [
  { slug: 'models', label: 'Modèles', description: 'Nouvelles familles de modèles, capacités et benchmarks.' },
  { slug: 'research', label: 'Recherche', description: 'Travaux scientifiques, méthodes et résultats expérimentaux.' },
  { slug: 'open-source', label: 'Open source', description: 'Poids ouverts, outils communautaires et inférence locale.' },
  { slug: 'policy', label: 'Régulation', description: 'Cadres juridiques, conformité et gouvernance de l’IA.' },
  { slug: 'business', label: 'Business', description: 'Adoption en entreprise, coûts et marché.' },
  { slug: 'agents', label: 'Agents IA', description: 'Agents autonomes, outils et évaluation de leurs parcours.' },
] as const;

export type CategorySlug = (typeof TOPICS)[number]['slug'];
export interface Topic {
  slug: CategorySlug;
  label: string;
  description: string;
}

export const CATEGORY_SLUGS: readonly CategorySlug[] = TOPICS.map((topic) => topic.slug);

export function isCategorySlug(value: unknown): value is CategorySlug {
  return typeof value === 'string' && (CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((topic) => topic.slug === slug);
}

export function getTopicLabel(slug: CategorySlug): string {
  return getTopic(slug)?.label ?? slug;
}
