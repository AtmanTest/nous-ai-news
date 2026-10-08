/**
 * Données de référence des tests (« test data management »).
 * Ces constantes décrivent le jeu de données de démonstration ; leur cohérence avec
 * src/modules/articles/data.ts est vérifiée par tests/unit/data/integrity.test.ts,
 * ce qui évite toute dérive silencieuse entre données et tests.
 */
export const SEED = {
  totalArticles: 18,
  perCategory: 3,
  defaultPageSize: 9,
  categories: ['models', 'research', 'open-source', 'policy', 'business', 'agents'] as const,
  categoryLabels: {
    models: 'Modèles',
    research: 'Recherche',
    'open-source': 'Open source',
    policy: 'Régulation',
    business: 'Business',
    agents: 'Agents IA',
  } as Record<string, string>,
  /** Ordre « newest » : page 1 puis page 2. */
  page1Slugs: [
    'modeles-raisonnement-longue-duree',
    'poids-ouverts-licences-usage',
    'interpretabilite-circuits-internes',
    'transparence-systemes-ia-europe',
    'adoption-entreprise-ia-generative',
    'agents-outils-protocoles-ouverts',
    'fenetre-contexte-million-tokens',
    'cout-inference-baisse',
    'inference-locale-materiel-grand-public',
  ],
  page2Slugs: [
    'agents-codage-revue-humaine',
    'donnees-synthetiques-entrainement',
    'audits-independants-modeles-avances',
    'evaluation-agents-parcours-longs',
    'modeles-multimodaux-video',
    'startups-ia-verticale',
    'outils-evaluation-ouverts',
    'evaluation-contamination-benchmarks',
    'droit-auteur-donnees-entrainement',
  ],
} as const;

export const NEWEST_SLUG = SEED.page1Slugs[0];
export const OLDEST_SLUG = SEED.page2Slugs[8];

/** Article de référence pour les parcours de détail, favoris et articles liés. */
export const KNOWN_ARTICLE = {
  slug: 'agents-codage-revue-humaine',
  title: 'Agents de codage : la revue humaine reste le point de contrôle clé',
  category: 'agents',
  categoryLabel: 'Agents IA',
  /** Les deux autres articles de la thématique « agents », du plus récent au plus ancien. */
  relatedSlugs: ['agents-outils-protocoles-ouverts', 'evaluation-agents-parcours-longs'],
} as const;

/** Adresse unique par appel : isole les tests du store en mémoire partagé (pas de reset d'état global). */
export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Domaine valide de longueur exacte `length`, composé de labels de 63 caractères maximum, terminé par « .com ». */
function domainOfLength(length: number): string {
  const tld = 'com';
  const labelCount = Math.ceil((length - tld.length) / 64); // 63 car. + 1 point par label
  let remaining = length - tld.length - labelCount; // caractères restant à répartir dans les labels
  const labels: string[] = [];
  for (let i = 0; i < labelCount; i++) {
    const reserved = labelCount - 1 - i; // 1 caractère minimum pour chaque label à venir
    const take = Math.min(63, remaining - reserved);
    labels.push('d'.repeat(take));
    remaining -= take;
  }
  return `${labels.join('.')}.${tld}`;
}

/** Adresse unique, valide, dont la longueur totale vaut exactement `total` (analyse des valeurs limites). */
export function emailOfLength(total: number): string {
  const local = uniqueEmail('len').split('@')[0] as string;
  return `${local}@${domainOfLength(total - local.length - 1)}`; // -1 pour « @ »
}

/** Adresse unique dont la partie locale vaut exactement `localLength` caractères. */
export function emailWithLocalLength(localLength: number): string {
  const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  return `${unique.padEnd(localLength, 'x').slice(0, localLength)}@example.com`;
}
