import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
let cache: { data: any[]; timestamp: number } | null = null;

interface HFModel {
  id: string;
  author: string;
  name: string;
  task: string;
  downloads: number;
  likes: number;
  params: string;
  updated: string;
  link: string;
}

/**
 * GET /api/huggingface/trending?limit=10
 *
 * Returns top trending models from Hugging Face.
 * Fetches from HF API sorted by downloads × recency.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 25);

  // Return from cache if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ models: cache.data.slice(0, limit), cached: true });
  }

  try {
    // Fetch top models by likes × recency from HF API
    const res = await fetch(
      'https://huggingface.co/api/models?sort=downloads&direction=-1&limit=50',
      { headers: { 'User-Agent': 'DailyAI/1.0' }, signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) throw new Error(`HF API error: ${res.status}`);

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ models: [], cached: false });
    }

    // Filter out low-quality models (private, spammy, 0 downloads)
    const models: HFModel[] = data
      .filter((m: any) => !m.private && (m.likes > 0 || m.downloads > 100))
      .slice(0, limit)
      .map((m: any) => {
        const fullId = m.id || m.modelId || '';
        const parts = fullId.split('/');
        const author = parts[0] || '';
        const name = parts.slice(1).join('/') || fullId;

        // Extract model params from tags or description
        const paramTag = (m.tags || []).find((t: string) => /^\d+[.]?\d*[BMK]?$/.test(t));
        const params = paramTag || '';

        return {
          id: fullId,
          author,
          name,
          task: m.pipeline_tag || m.library_name || '',
          downloads: m.downloads || 0,
          likes: m.likes || 0,
          params,
          updated: m.lastModified || m.createdAt || '',
          link: `https://huggingface.co/${fullId}`,
        };
      });

    cache = { data: models, timestamp: Date.now() };

    return NextResponse.json({ models, cached: false });
  } catch (err) {
    console.error('[HF API] Error:', err);

    // Fall back to cache even if stale
    if (cache) {
      return NextResponse.json({ models: cache.data.slice(0, limit), cached: true, stale: true });
    }

    return NextResponse.json({ models: [], cached: false, error: 'Failed to fetch' });
  }
}
