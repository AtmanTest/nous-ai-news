import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MODEL_NAME_PATTERNS = [
  // Claude series
  { regex: /Claude\s*(?:3\.5|4\.\d+|4|Opus|Sonnet|Haiku)/gi, name: null },
  // GPT series
  { regex: /GPT[-_]?(?:4[ot]?|5|4\.\d+|o[123]?|mini|turbo)/gi, name: null },
  // Gemini series
  { regex: /Gemini\s*(?:2\.\d+|Ultra|Pro|Flash|Nano|Exp)/gi, name: null },
  // DeepSeek series
  { regex: /DeepSeek[-_ ]?(?:R1|V3|R2|VL2?|Coder|Pro|V2\.\d+)/gi, name: null },
  // Qwen series
  { regex: /Qwen[23]?(?:[-_])?(?:\d+[.]?\d*B)?(?:\s*[-\/]\s*[A-Za-z0-9]+)?/gi, name: null },
  // Llama series
  { regex: /Llama\s*(?:3\.\d+|4\.\d+|2\.\d+)?/gi, name: null },
  // Mistral series
  { regex: /Mistral\s*(?:Large|Small|Nemo|Saba|7B|8x22B|NeMo|3\.\d+)?/gi, name: null },
  // Phi series
  { regex: /Phi[-_]?(?:3\.\d+|4|mini|vision|silica|moE)?/gi, name: null },
  // Grok series
  { regex: /Grok[-_ ]?(?:3|2|1\.\d+)?/gi, name: null },
  // Stable Diffusion
  { regex: /Stable\s*Diffusion\s*(?:3[.]?\d+|4[.]?\d+|XL|Turbo)?/gi, name: null },
  // General model patterns (catch-all for new versions)
  { regex: /(?:\w+[-_])?(?:\d+[.]?\d*[Bb])(?:[-_]\w+)?/gi, name: null },
];

function extractModelNames(title: string, summary: string | null, tags: string[]): string[] {
  const text = `${title} ${summary || ''} ${tags.join(' ')}`;
  const found = new Set<string>();

  for (const { regex } of MODEL_NAME_PATTERNS) {
    let m;
    while ((m = regex.exec(text)) !== null) {
      found.add(m[0].trim());
    }
  }

  return Array.from(found);
}

/**
 * GET /api/news/models?limit=10
 *
 * Returns latest AI model mentions extracted from real articles.
 * Queries articles with category='models' or entities containing model type.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 30);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch recent articles about models (category or entities containing model type)
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, summary, source_name, category, tags, entities, published_at, score')
    .eq('status', 'published')
    .eq('category', 'models')
    .gte('published_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // last 14 days
    .order('published_at', { ascending: false })
    .limit(limit * 3); // fetch extra for dedup

  if (error) {
    console.error('API /api/news/models error:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }

  // Build model entries: deduplicate by model name, keep the most recent article
  const modelMap = new Map<string, {
    name: string;
    articleId: string;
    articleTitle: string;
    sourceName: string;
    publishedAt: string;
    score: number;
    link: string;
  }>();

  for (const article of (data || [])) {
    const modelNames = extractModelNames(article.title, article.summary, article.tags || []);

    // Also extract from entities
    let entityModels: string[] = [];
    try {
      const entities = typeof article.entities === 'string'
        ? JSON.parse(article.entities)
        : article.entities || [];
      entityModels = entities
        .filter((e: any) => e.type === 'model')
        .map((e: any) => e.name);
    } catch {}

    const allNames = [...new Set([...modelNames, ...entityModels])];

    for (const name of allNames) {
      const key = name.toLowerCase().replace(/[\s_-]+/g, '');
      if (!modelMap.has(key)) {
        modelMap.set(key, {
          name: name.replace(/\b(\w)/g, (c) => c.toUpperCase()),
          articleId: article.id,
          articleTitle: article.title,
          sourceName: article.source_name,
          publishedAt: article.published_at,
          score: article.score || 0,
          link: `/article/${article.id}`,
        });
      }
    }
  }

  // Sort by published date (newest first), take top N
  const models = Array.from(modelMap.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);

  return NextResponse.json({
    models,
    total: models.length,
    cached: false,
  });
}
