import type { NormalizedArticle, ArticleEntity } from './types';

export function enrichArticle(article: NormalizedArticle): NormalizedArticle {
  // Extract more entities
  const entities = extractDeepEntities(
    `${article.title} ${article.summary || ''} ${article.content || ''}`
  );

  // Deduplicate and merge entities
  const mergedEntities = mergeEntities([...article.entities, ...entities]);

  // Extract country mentions
  const countries = extractCountries(
    `${article.title} ${article.summary || ''}`
  );

  // Add country entities
  for (const country of countries) {
    if (!mergedEntities.some((e) => e.type === 'country' && e.name.toLowerCase() === country.toLowerCase())) {
      mergedEntities.push({ type: 'country', name: country, confidence: 0.7 });
    }
  }

  return {
    ...article,
    entities: mergedEntities,
    tags: [...new Set([...article.tags, ...countries.map((c) => c.toLowerCase())])],
  };
}

function extractDeepEntities(text: string): ArticleEntity[] {
  const entities: ArticleEntity[] = [];
  const lower = text.toLowerCase();

  // Research institutions
  const institutions: Record<string, string> = {
    'mit': 'MIT',
    'stanford': 'Stanford',
    'berkeley': 'UC Berkeley',
    'oxford': 'Oxford University',
    'cambridge': 'Cambridge University',
    'eth zurich': 'ETH Zurich',
    'mila': 'Mila',
    'deepmind': 'Google DeepMind',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
  };

  for (const [key, name] of Object.entries(institutions)) {
    if (lower.includes(key)) {
      entities.push({ type: 'company', name, confidence: 0.85 });
    }
  }

  // Products and tools
  const products: Record<string, string> = {
    'chatgpt': 'ChatGPT',
    'copilot': 'GitHub Copilot',
    'cursor': 'Cursor',
    'claude': 'Claude',
    'gemini': 'Gemini',
    'dall-e': 'DALL-E',
    'sora': 'Sora',
    'midjourney': 'Midjourney',
    'stable diffusion': 'Stable Diffusion',
  };

  for (const [key, name] of Object.entries(products)) {
    if (lower.includes(key)) {
      entities.push({ type: 'product', name, confidence: 0.9 });
    }
  }

  return entities;
}

function mergeEntities(entities: ArticleEntity[]): ArticleEntity[] {
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.type}:${e.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractCountries(text: string): string[] {
  const lower = text.toLowerCase();
  const countries: string[] = [];

  const countryPatterns: [RegExp, string][] = [
    [/united states|us|usa|american/i, 'US'],
    [/china|chinese|beijing/i, 'CN'],
    [/europe|european|eu/i, 'EU'],
    [/united kingdom|uk|britain|british|london/i, 'UK'],
    [/france|french|paris/i, 'FR'],
    [/germany|german|berlin/i, 'DE'],
    [/japan|japanese|tokyo/i, 'JP'],
    [/south korea|korea|seoul/i, 'KR'],
    [/israel|tel aviv/i, 'IL'],
    [/canada|canadian|toronto|montreal/i, 'CA'],
    [/india|indian|bangalore/i, 'IN'],
    [/singapore/i, 'SG'],
  ];

  for (const [pattern, code] of countryPatterns) {
    if (pattern.test(lower)) {
      countries.push(code);
    }
  }

  return [...new Set(countries)];
}
