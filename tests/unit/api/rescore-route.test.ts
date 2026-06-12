import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────
// vi.mock() factories are hoisted to the top of the file,
// so any variables they reference must also be hoisted.

const {
  mockSupabaseFrom,
  mockSupabaseSelect,
  mockSupabaseGte,
  mockSupabaseOrder,
  mockSupabaseLimit,
  mockSupabaseUpsert,
  mockSupabaseClient,
  mockRescoreArticles,
} = vi.hoisted(() => {
  const _mockSupabaseFrom = vi.fn();
  const _mockSupabaseSelect = vi.fn();
  const _mockSupabaseGte = vi.fn();
  const _mockSupabaseOrder = vi.fn();
  const _mockSupabaseLimit = vi.fn();
  const _mockSupabaseUpsert = vi.fn();
  const _mockSupabaseClient = { from: _mockSupabaseFrom };
  const _mockRescoreArticles = vi.fn();
  return {
    mockSupabaseFrom: _mockSupabaseFrom,
    mockSupabaseSelect: _mockSupabaseSelect,
    mockSupabaseGte: _mockSupabaseGte,
    mockSupabaseOrder: _mockSupabaseOrder,
    mockSupabaseLimit: _mockSupabaseLimit,
    mockSupabaseUpsert: _mockSupabaseUpsert,
    mockSupabaseClient: _mockSupabaseClient,
    mockRescoreArticles: _mockRescoreArticles,
  };
});

// Mock modules — factories reference hoisted variables
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/lib/pipeline/rank', () => ({
  rescoreArticles: mockRescoreArticles,
}));

// ─── Import (mocked modules are already resolved) ───────────

import { GET, POST } from '@/app/api/cron/rescore/route';

// ─── Helper to build a fetch-like Request ───────────────────

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) {
    headers.set('authorization', authHeader);
  }
  return new Request('http://localhost:3000/api/cron/rescore', {
    method: 'POST',
    headers,
  });
}

function mockArticles(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `article-${i}`,
    title: `Article ${i}`,
    summary: 'A summary',
    score: 50 + i,
    base_score: 50,
    social_momentum: null,
    published_at: new Date(Date.now() - i * 3600_000).toISOString(),
    category: 'ai',
    source_name: 'Test Source',
    source_type: 'rss',
    detected_models: ['gpt-4'],
  }));
}

/**
 * Configure mockSupabaseFrom to return an object with both:
 *  - .select(...).gte(...).order(...).limit(...)  for article fetch
 *  - .upsert(...)                                   for batch update
 * The route calls client.from('articles') twice — both calls get this object.
 */
function setupSupabase(articles: Record<string, unknown>[]) {
  // Configure the select chain
  mockSupabaseLimit.mockResolvedValue({ data: articles, error: null });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseGte.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({ gte: mockSupabaseGte });

  // Make from() return an object that supports BOTH select and upsert
  const tableObj = {
    select: mockSupabaseSelect,
    upsert: mockSupabaseUpsert,
  };
  mockSupabaseFrom.mockReturnValue(tableObj);
}

function setupSupabaseEmpty() {
  setupSupabase([]);
}

function setupSupabaseFetchError() {
  mockSupabaseLimit.mockResolvedValue({ data: null, error: { message: 'DB connection failed' } });
  mockSupabaseOrder.mockReturnValue({ limit: mockSupabaseLimit });
  mockSupabaseGte.mockReturnValue({ order: mockSupabaseOrder });
  mockSupabaseSelect.mockReturnValue({ gte: mockSupabaseGte });

  const tableObj = {
    select: mockSupabaseSelect,
    upsert: mockSupabaseUpsert,
  };
  mockSupabaseFrom.mockReturnValue(tableObj);
}

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.CRON_SECRET;
  // Set default Supabase env so getClient() returns the mock client
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

describe('GET /api/cron/rescore', () => {
  it('returns status ready and POST message', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('status', 'ready');
    expect(body).toHaveProperty('message', 'POST to trigger article rescore');
    expect(body).toHaveProperty('lookback_hours', 72);
    expect(body).toHaveProperty('batch_size', 100);
  });
});

describe('POST /api/cron/rescore', () => {
  beforeEach(() => {
    delete process.env.CRON_SECRET;
  });

  // Must run first — getClient() caches the client on first call,
  // so we need to verify the unconfigured path before any test triggers caching.
  it('returns 500 when Supabase client is not configured', async () => {
    // Clear any cached client by calling with missing env vars
    // before the client gets cached
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: 'Supabase client not configured',
    });
  });

  it('returns 401 when CRON_SECRET is set and auth header is missing', async () => {
    process.env.CRON_SECRET = 'my-secret-key';
    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when CRON_SECRET is set and auth header is wrong', async () => {
    process.env.CRON_SECRET = 'my-secret-key';
    const response = await POST(makeRequest('Bearer wrong-key'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('succeeds with no auth when CRON_SECRET is not set', async () => {
    setupSupabaseEmpty();
    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('total_articles', 0);
    expect(body).toHaveProperty('total_updated', 0);
    expect(body).toHaveProperty('total_duration_ms');
    expect(body).toHaveProperty('message', 'No articles to rescore');
  });

  it('succeeds with correct Bearer token when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'my-secret-key';
    setupSupabaseEmpty();
    const response = await POST(makeRequest('Bearer my-secret-key'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('success', true);
  });

  it('returns "No articles to rescore" when Supabase returns empty array', async () => {
    setupSupabaseEmpty();
    const response = await POST(makeRequest());
    const body = await response.json();

    expect(body.total_articles).toBe(0);
    expect(body.message).toBe('No articles to rescore');
  });

  it('returns 500 when Supabase fetch fails', async () => {
    setupSupabaseFetchError();
    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Fetch error');
  });

  it('rescores articles and upserts results', async () => {
    const articles = mockArticles(3);
    mockSupabaseUpsert.mockResolvedValue({ error: null });
    setupSupabase(articles);

    mockRescoreArticles.mockResolvedValue(
      articles.map((a) => ({
        articleId: a.id,
        previousScore: a.score as number,
        newScore: 75,
        trendingScore: 70,
        socialMomentum: 45,
        breakdown: { baseContribution: 5 },
      })),
    );

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total_articles).toBe(3);
    expect(body.total_updated).toBe(3);
    expect(body.average_new_score).toBe(75);
    expect(body).toHaveProperty('total_duration_ms');
    expect(body).toHaveProperty('lookback_hours', 72);

    // Verify upsert was called with update payloads
    expect(mockSupabaseUpsert).toHaveBeenCalledTimes(1);
    const [updatePayload, upsertOptions] = mockSupabaseUpsert.mock.calls[0];
    expect(updatePayload).toHaveLength(3);
    expect(updatePayload[0]).toHaveProperty('id', 'article-0');
    expect(updatePayload[0]).toHaveProperty('score', 75);
    expect(updatePayload[0]).toHaveProperty('social_momentum', 45);
    expect(updatePayload[0]).toHaveProperty('updated_at');
    expect(upsertOptions).toEqual({ onConflict: 'id' });
  });

  it('rescores large sets in multiple batches of up to 100', async () => {
    const articles = mockArticles(250);
    mockSupabaseUpsert.mockResolvedValue({ error: null });
    setupSupabase(articles);

    mockRescoreArticles.mockImplementation(
      (batch: Array<{ id: string }>) =>
        Promise.resolve(batch.map((b) => ({
          articleId: b.id,
          newScore: 70,
          trendingScore: 65,
          socialMomentum: 40,
        }))),
    );

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total_articles).toBe(250);
    expect(body.total_updated).toBe(250);

    // Should have been called 3 times (100 + 100 + 50)
    expect(mockRescoreArticles).toHaveBeenCalledTimes(3);
    expect(mockSupabaseUpsert).toHaveBeenCalledTimes(3);
  });

  it('handles upsert errors gracefully without crashing', async () => {
    const articles = mockArticles(5);
    mockSupabaseUpsert.mockResolvedValue({ error: { message: 'Conflict on id' } });
    setupSupabase(articles);

    mockRescoreArticles.mockResolvedValue(
      articles.map((a) => ({
        articleId: a.id,
        newScore: 75,
        trendingScore: 70,
        socialMomentum: 45,
      })),
    );

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total_updated).toBe(5);
  });
});
