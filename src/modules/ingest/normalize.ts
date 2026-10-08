import type { Article } from '@/modules/articles/types';
import type { CategorySlug } from '@/modules/topics/topics';
import type { RawItem } from './feed';

export interface Source {
  id: string;
  name: string;
  url: string;
  lang: 'fr' | 'en';
  /** `true` : tous les articles du flux traitent d'IA ; sinon on filtre par mots-clés. */
  aiOnly: boolean;
}

/** Frontières de mots compatibles Unicode (\b ne gère pas les lettres accentuées). */
function words(alternatives: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, 'iu');
}

const AI_PATTERN = words(
  'ia|ai|intelligence artificielle|artificial intelligence|llm|gpt|chatgpt|openai|anthropic|claude|gemini|mistral|llama|deepseek|copilot|machine learning|apprentissage automatique|deep learning|neural|réseau de neurones|agents?|diffusion|générative?|generative|chatbot|transformer|nvidia|hugging ?face',
);

export function isAiRelated(text: string): boolean {
  return AI_PATTERN.test(text);
}

const CATEGORY_RULES: ReadonlyArray<{ category: CategorySlug; pattern: RegExp }> = [
  { category: 'policy', pattern: words('régulation|reglementation|règlement|loi|ai act|législat\\p{L}*|legislat\\p{L}*|regulat\\p{L}*|policy|lawsuit|procès|copyright|droit d\'auteur|gouvernance|governance|safety|sécurité|ban|interdit|commission européenne') },
  { category: 'agents', pattern: words('agents?|agentic|agentique|autonome|autonomous|mcp|computer use|assistant') },
  { category: 'open-source', pattern: words('open[- ]?source|open[- ]?weights?|poids ouverts|hugging ?face|llama|mistral|local|ollama|github') },
  { category: 'research', pattern: words('recherche|research|étude|study|paper|arxiv|benchmark|chercheurs?|researchers?|dataset|scientifi\\p{L}*') },
  { category: 'business', pattern: words('levée|funding|raises?|milliards?|billion|valorisation|valuation|investi|investment|startup|acquisition|acquiert|acquires|revenus?|revenue|entreprises?|enterprise|marché|market|nvidia|bourse|stock') },
  { category: 'models', pattern: words('modèles?|models?|gpt|gemini|claude|llm|lance|launch|release|sort|nouvelle version|version \\d') },
];

export function classify(text: string): CategorySlug {
  return CATEGORY_RULES.find((rule) => rule.pattern.test(text))?.category ?? 'models';
}

/** Hash FNV-1a 32 bits en base 36 : stable, sans dépendance. */
export function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(7, '0');
}

export function slugify(text: string, maxLength = 70): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.slice(0, maxLength).replace(/-+$/g, '');
}

/** Retire fragment et paramètres de suivi pour dédoublonner une même URL. */
export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    parsed.hash = '';
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/^(utm_|fbclid|gclid|mc_|ref$)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[\s,;:.–-]+$/, '')}…`;
}

export interface NormalizeOptions {
  now?: Date;
}

/** Convertit un élément de flux en article ; renvoie `null` si l'élément est inexploitable ou hors sujet. */
export function normalizeItem(item: RawItem, source: Source, options: NormalizeOptions = {}): Article | null {
  const now = options.now ?? new Date();
  const url = canonicalUrl(item.link);
  const title = item.title.trim();
  if (url === '' || title.length < 8) return null;

  const published = new Date(item.published);
  if (Number.isNaN(published.getTime())) return null;
  // Date dans le futur (flux mal configuré) : on ramène à « maintenant ».
  const publishedAt = (published > now ? now : published).toISOString();

  const text = `${title} ${item.summary}`;
  if (!source.aiOnly && !isAiRelated(text)) return null;

  const summary = truncate(item.summary === '' ? title : item.summary, 300);
  const words = item.summary.split(/\s+/).filter(Boolean).length;
  const hash = shortHash(url);
  const slug = `${slugify(title) || 'article'}-${hash}`;

  return {
    id: `ing-${hash}`,
    slug,
    title: truncate(title, 160),
    summary,
    body: [summary],
    category: classify(text),
    tags: [source.name],
    source: source.name,
    sourceUrl: url,
    publishedAt,
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
  };
}
