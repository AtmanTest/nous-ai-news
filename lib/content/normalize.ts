import type { RawArticle, NormalizedArticle, ArticleEntity } from './types';

const BREAKING_KEYWORDS = [
  'breaking', 'urgent', 'just in', 'exclusive', 'confirmed',
  'announces', 'launches', 'reveals', 'releases', 'unveils',
];

const KNOWN_COMPANIES = [
  'openai', 'anthropic', 'google deepmind', 'google', 'meta', 'microsoft',
  'nvidia', 'mistral', 'cohere', 'xai', 'stability ai', 'hugging face',
  'runway', 'luma', 'elevenlabs', 'midjourney', 'perplexity', 'notion',
  'databricks', 'replicate', 'together', 'fireworks', 'anyscale',
  'apple', 'amd', 'intel', 'qualcomm', 'tesla', 'spacex', 'ibm',
  'oracle', 'aws', 'azure', 'gcp', 'salesforce', 'sap', 'adobe',
  'sony', 'samsung', 'baidu', 'alibaba', 'tencent', 'bytedance',
];

const KNOWN_MODELS = [
  'gpt-4', 'gpt-4o', 'gpt-5', 'claude 3', 'claude 4', 'gemini', 'gemini ultra',
  'llama', 'llama 3', 'llama 4', 'mistral', 'mixtral', 'dbrx', 'command r',
  'grok', 'stable diffusion', 'dall-e', 'sora', 'veo', 'flux', 'ideogram',
  'qwen', 'deepseek', 'phi', 'falcon', 'olmo', 'nemotron', 'granite',
];

// ── Keyword → Category mapping ────────────────────────────

interface KeywordRule {
  pattern: RegExp;
  category: string;
  label: string;
}

const categoryRules: KeywordRule[] = [
  { pattern: /\b(GPT|Claude|Gemini|Llama|Mistral|DeepSeek|Qwen|Phi|Falcon|DALL.E|Stable Diffusion|Sora|Veo|Midjourney|Runway|Pika)\b/i, category: 'models', label: 'AI Models' },
  { pattern: /\b(model release|new model|open model|language model|vision model|foundation model|diffusion model|multimodal)\b/i, category: 'models', label: 'AI Models' },
  { pattern: /\b(GPU|TPU|NPU|chip|processor|semiconductor|H100|B200|Blackwell|Hopper|MI300|Gaudi|transistor|wafer|fabrication)\b/i, category: 'hardware', label: 'Hardware' },
  { pattern: /\b(quantization|fine.tune|fine tune|LoRA|QLoRA|RLHF|DPO|inference|training|compute|parameter)\b/i, category: 'models', label: 'AI Models' },
  { pattern: /\b(research|paper|preprint|arxiv|benchmark|state.of.the.art|SOTA|breakthrough|discovery|novel|architecture|attention|transformer)\b/i, category: 'research', label: 'Research' },
  { pattern: /\b(reasoning|chain.of.thought|CoT|alignment|safety|interpretability|mechanistic interpretability|activation steering|RLHF safety|red team|jailbreak)\b/i, category: 'research', label: 'Research' },
  { pattern: /\b(agent|multi.agent|agentic|autonomous|tool.use|function calling|orchestration)\b/i, category: 'research', label: 'Research' },
  { pattern: /\b(funding|fundraise|series [A-Z]|valuation|IPO|acquisition|merger|billion.*investment|revenue|profit|market cap|ARR)\b/i, category: 'business', label: 'Business' },
  { pattern: /\b(startup|YC |accelerator|incubator|seed|pre.seed|venture|VC |investor)\b/i, category: 'startups', label: 'Startups' },
  { pattern: /\b(stock|share price|market|NASDAQ|NYSE|investor|earnings|quarterly|profitability|layoff|restructuring|downsize)\b/i, category: 'business', label: 'Business' },
  { pattern: /\b(partnership|strategic.*alliance|collaboration|joint venture|enterprise|B2B|SaaS|subscription|pricing|tier)\b/i, category: 'business', label: 'Business' },
  { pattern: /\b(regulation|regulatory|EU AI Act|Executive Order|White House|Congress|Senate|law|legislation|compliance|governance|GDPR|Copyright|liability)\b/i, category: 'policy', label: 'Policy & Regulation' },
  { pattern: /\b(CMA|FTC|DOJ|competition|antitrust|monopoly|investigation|fine|sanction|authority|decision|opt.out|opt.in)\b/i, category: 'policy', label: 'Policy & Regulation' },
  { pattern: /\b(open source|open.weight|open.model|Hugging Face|GitHub|repository|MIT license|Apache|permissive|OSI|open.weight)\b/i, category: 'open-source', label: 'Open Source' },
  { pattern: /\b(robot|humanoid|drone|autonomous vehicle|self.driving|edge AI|IoT|sensor)\b/i, category: 'hardware', label: 'Hardware' },
  { pattern: /\b(data center|hyperscaler|server|cluster|infrastructure|cloud|AWS|Azure|GCP|Oracle|equinix|colocation|power|energy|water|cooling)\b/i, category: 'hardware', label: 'Hardware' },
];

// ── Event tag rules (uppercase descriptors like ActuIA) ──────

const eventTagRules: { pattern: RegExp; tag: string }[] = [
  { pattern: /\b(partnership|alliance|collaboration|joint venture|team.up|teams up)\b/i, tag: 'ALLIANCE STRATÉGIQUE' },
  { pattern: /\b(acquisition|acquired|buys|purchase|merge|merger)\b/i, tag: 'ACQUISITION' },
  { pattern: /\b(funding|fundraise|series [A-Z]|raised|investment|invest.*million|invest.*billion)\b/i, tag: 'LEVÉE DE FONDS' },
  { pattern: /\b(IPO|going public|public offering|stock market|listing)\b/i, tag: 'INTRODUCTION EN BOURSE' },
  { pattern: /\b(regulation|regulatory|fine|penalty|sanction|order|law|lawsuilt|sue|suing|litigation)\b/i, tag: "DÉCISION D'AUTORITÉ" },
  { pattern: /\b(layoff|lay off|downsize|restructuring|restructure|cut|cutting jobs|redundancy|firing)\b/i, tag: 'RESTRUCTURATION' },
  { pattern: /\b(GPU|chip|TPU|processor|semiconductor|hardware|data center|infrastructure)\b/i, tag: 'PUCE / GPU / MATÉRIEL' },
  { pattern: /\b(open source|open.weight|open.model|release.*model|open.*release)\b/i, tag: 'OPEN SOURCE' },
  { pattern: /\b(safety|alignment|red team|jailbreak|bias|fairness|guardrail)\b/i, tag: 'SÉCURITÉ / ALIGNEMENT' },
  { pattern: /\b(research|paper|preprint|arxiv|breakthrough|discovery|scientist|lab)\b/i, tag: 'RECHERCHE' },
  { pattern: /\b(robot|humanoid|drone|autonomous|self.driving)\b/i, tag: 'ROBOTIQUE' },
  { pattern: /\b(agent|agentic|autonomous.*agent|multi.agent)\b/i, tag: 'AGENTS IA' },
];

// ── Sector rules ───────────────────────────────────────────

const sectorRules: KeywordRule[] = [
  { pattern: /\b(santé|health|medical|clinical|hospital|drug|biotech|diagnostic|patient|doctor)\b/i, category: 'health', label: 'Santé' },
  { pattern: /\b(finance|bank|banking|assurance|insurance|trading|fintech|payment|payments)\b/i, category: 'finance', label: 'Finance' },
  { pattern: /\b(industrie|industry|manufacturing|factory|usine|production|supply chain|logistique|logistics)\b/i, category: 'industry', label: 'Industrie' },
  { pattern: /\b(énergie|energy|electricity|électricité|oil|pétrole|gas|gaz|renewable|nuclear|nucléaire|solar|wind)\b/i, category: 'energy', label: 'Énergie' },
  { pattern: /\b(transport|mobility|mobilité|automotive|auto|voiture|car|vehicle|train|aviation)\b/i, category: 'transport', label: 'Transport' },
  { pattern: /\b(défense|defense|military|armée|army|security|surveillance)\b/i, category: 'defense', label: 'Défense' },
  { pattern: /\b(justice|judiciaire|court|tribunal|judge|procureur|law enforcement|police)\b/i, category: 'justice', label: 'Justice' },
  { pattern: /\b(média|media|journalism|presse|news|broadcast|tv|télévision|radio|podcast)\b/i, category: 'media', label: 'Médias' },
  { pattern: /\b(éducation|education|school|école|university|université|teaching|learning|student|étudiant)\b/i, category: 'education', label: 'Éducation' },
  { pattern: /\b(commerce|retail|ecommerce|marketing|publicité|advertising|consumer|consommateur|brand)\b/i, category: 'commerce', label: 'Commerce' },
  { pattern: /\b(télécom|telecom|telecommunication|5G|6G|network|réseau|connectivity|bandwidth)\b/i, category: 'telecom', label: 'Télécoms' },
];

function matchFirst(text: string, rules: KeywordRule[]): { category: string; label: string } | null {
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      return { category: rule.category, label: rule.label };
    }
  }
  return null;
}

export function categorizeArticle(text: string): {
  category: string;
  categoryLabel: string;
  sector?: string;
  eventTags: string[];
} {
  // Primary category
  const matched = matchFirst(text, categoryRules);

  // Sector
  const sector = matchFirst(text, sectorRules);

  // Event tags
  const eventTags: string[] = [];
  for (const rule of eventTagRules) {
    if (rule.pattern.test(text)) {
      eventTags.push(rule.tag);
      if (eventTags.length >= 3) break;
    }
  }

  return {
    category: matched?.category || 'general',
    categoryLabel: matched?.label || 'General',
    sector: sector?.label,
    eventTags,
  };
}

export function cleanArticleText(value: string | null | undefined): string {
  let text = (value || '').trim();

  // Some feeds incorrectly HTML-escape CDATA markers, storing titles like
  // `&lt;![CDATA[[A] Title]]&gt;` as literal text. Decode entities first,
  // then unwrap CDATA defensively. The final marker cleanup also handles
  // partial fragments that previously leaked into generated tags.
  for (let i = 0; i < 3; i += 1) {
    const before = text;
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&hellip;/g, '…')
      .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1')
      .replace(/<!\[CDATA\[/gi, '')
      .replace(/\]\]>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (text === before) break;
  }

  return text;
}

export function normalizeArticle(
  raw: RawArticle,
  sourceId: string
): NormalizedArticle {
  const title = cleanArticleText(raw.title);
  const summary = raw.summary ? cleanArticleText(raw.summary) : '';
  const content = raw.content ? cleanArticleText(raw.content) : '';
  const url = raw.url.split('?')[0].split('#')[0]; // Clean URL
  const published_at = raw.published_at
    ? new Date(raw.published_at).toISOString()
    : new Date().toISOString();

  // Detect language (simple heuristic)
  const language = detectLanguage(`${title} ${summary}`);

  // Extract entities
  const entities = extractEntities(`${title} ${summary} ${content}`);

  // Calculate initial score
  const score = calculateInitialScore({ ...raw, title, summary, content });

  // Detect if breaking
  const is_breaking = BREAKING_KEYWORDS.some((kw) =>
    title.toLowerCase().includes(kw)
  );

  // Auto-categorize (comprehensive version)
  const classifyText = [title, summary, raw.source_name].filter(Boolean).join(' ');
  const { category, eventTags } = categorizeArticle(classifyText);

  // Auto-tag: combine event tags, entities, and title keywords
  const tags = buildTags(title, entities, eventTags);

  return {
    url,
    title,
    summary: summary ? summary.slice(0, 500) : null,
    content: content ? content.slice(0, 10000) : null,
    author: raw.author || null,
    published_at,
    image_url: raw.image_url || null,
    source_name: raw.source_name,
    source_type: raw.source_type,
    source_id: sourceId,
    external_id: raw.external_id || null,
    language,
    category,
    tags,
    entities,
    score,
    is_breaking,
  };
}

function buildTags(
  title: string,
  entities: ArticleEntity[],
  eventTags: string[]
): string[] {
  const tags = new Set<string>();

  // Event tags first (ActuIA-style descriptors)
  for (const tag of eventTags) {
    tags.add(tag);
  }

  // Entity names
  for (const entity of entities) {
    tags.add(entity.name);
  }

  // Significant title words (grouped by bigrams)
  const words = cleanArticleText(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'the', 'and', 'for', 'are', 'was', 'has', 'its', 'new', 'how', 'why', 'what', 'can', 'not', 'but', 'all', 'who', 'out', 'just', 'more', 'also', 'into', 'over', 'than', 'then', 'after', 'about', 'they']);

  // Bigrams (more meaningful than single words)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (bigram.length > 6 && ![...stopWords].every(w => words[i] === w || words[i + 1] === w)) {
      tags.add(bigram);
    }
  }

  return Array.from(tags)
    .map((tag) => cleanArticleText(tag))
    .filter((tag) => tag.length > 0 && !/cdata/i.test(tag))
    .slice(0, 10);
}

// ── Existing functions (unchanged) ──────────────────────────

function detectLanguage(text: string): string {
  const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
  if (hasCJK) return 'zh';
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  if (hasJapanese) return 'ja';
  const hasKorean = /[\uac00-\ud7af]/.test(text);
  if (hasKorean) return 'ko';
  const hasCyrillic = /[\u0400-\u04ff]/.test(text);
  if (hasCyrillic) return 'ru';
  const hasAccentedFrench = /[àâçéèêëîïôûùüÿœ]/i.test(text);
  if (hasAccentedFrench) return 'fr';
  const hasGerman = /[äöüß]/i.test(text);
  if (hasGerman) return 'de';
  const hasSpanish = /[ñ¿¡áéíóú]/i.test(text);
  if (hasSpanish) return 'es';
  return 'en';
}

function extractEntities(text: string): ArticleEntity[] {
  const entities: ArticleEntity[] = [];
  const lower = text.toLowerCase();

  for (const company of KNOWN_COMPANIES) {
    if (lower.includes(company)) {
      entities.push({ type: 'company', name: company, confidence: 0.9 });
    }
  }
  for (const model of KNOWN_MODELS) {
    if (lower.includes(model)) {
      entities.push({ type: 'model', name: model, confidence: 0.95 });
    }
  }
  return entities;
}

function calculateInitialScore(raw: RawArticle): number {
  let score = 50;
  const tierBonuses: Record<string, number> = {
    openai: 20, anthropic: 20, deepmind: 20, 'meta ai': 18,
    'microsoft ai': 18, nvidia: 17, mistral: 16,
  };
  const sourceLower = raw.source_name.toLowerCase();
  for (const [key, bonus] of Object.entries(tierBonuses)) {
    if (sourceLower.includes(key)) {
      score += bonus;
      break;
    }
  }
  if (BREAKING_KEYWORDS.some((kw) => raw.title.toLowerCase().includes(kw))) {
    score += 15;
  }
  if (raw.content && raw.content.length > 500) score += 5;
  if (raw.summary) score += 3;
  return Math.min(score, 100);
}
