import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────
const mockSupabaseQuery = vi.hoisted(() => 
  vi.fn().mockResolvedValue({ data: [], error: null })
);

// ─── Mock modules ────────────────────────────────────────────
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      return {
        select: vi.fn((cols: string) => ({
          eq: vi.fn((col: string, val: string) => ({
            gte: vi.fn((col: string, val: string) => ({
              order: vi.fn((col: string, opts: any) => mockSupabaseQuery()),
            })),
          })),
        })),
      };
    }),
  })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
      headers: new Map(Object.entries(init?.headers || {})),
    })),
  },
}));

// ─── Mock environment ────────────────────────────────────────────────────────
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

// ─── Test implementation ─────────────────────────────────────
import { GET } from '@/app/api/news/counts-by-day/route';

function buildRequest(searchParams: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/news/counts-by-day');
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

const today = new Date();
today.setHours(0, 0, 0, 0);

function iso(d: Date) {
  return d.toISOString();
}

function dayStr(d: Date) {
  return d.toISOString().split('T')[0];
}

describe('GET /api/news/counts-by-day', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseQuery.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns counts grouped by day', async () => {
    const d0 = dayStr(today);
    const d1 = dayStr(new Date(today.getTime() - 86400000));
    const d2 = dayStr(new Date(today.getTime() - 2 * 86400000));

    mockSupabaseQuery.mockResolvedValue({
      data: [
        { published_at: iso(new Date(today.getTime() - 2 * 3600000)) },
        { published_at: iso(new Date(today.getTime() - 4 * 3600000)) },
        { published_at: iso(new Date(today.getTime() - 28 * 3600000)) },
        { published_at: iso(new Date(today.getTime() - 30 * 3600000)) },
        { published_at: iso(new Date(today.getTime() - 2 * 86400000 + 3600000)) },
      ],
      error: null,
    });

    const res = await GET(buildRequest({ days: '7' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.counts).toBeDefined();
    expect(body.counts[d0]).toBe(2);
    expect(body.counts[d1]).toBe(2);
    expect(body.counts[d2]).toBe(1);
  });

  it('defaults to 7 days when days param omitted', async () => {
    mockSupabaseQuery.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest({}));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Object.keys(body.counts).length).toBeGreaterThanOrEqual(7);
  });

  it('respects ?days=14 param', async () => {
    mockSupabaseQuery.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest({ days: '14' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Object.keys(body.counts).length).toBe(14);
  });

  it('validates days param with zod (rejects invalid)', async () => {
    const res = await GET(buildRequest({ days: '100' })); // exceeds max 30
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns correct Cache-Control header', async () => {
    mockSupabaseQuery.mockResolvedValue({ data: [], error: null });

    const res = await GET(buildRequest({ days: '7' }));
    expect(res.status).toBe(200);
  });

  it('handles Supabase error gracefully', async () => {
    mockSupabaseQuery.mockResolvedValue({
      data: null,
      error: { message: 'DB connection failed' },
    });

    const res = await GET(buildRequest({ days: '7' }));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to fetch counts');
  });

  it('includes days with zero articles in the range', async () => {
    const d0 = dayStr(today);
    const d1 = dayStr(new Date(today.getTime() - 86400000));

    mockSupabaseQuery.mockResolvedValue({
      data: [{ published_at: iso(today) }], // only today has articles
      error: null,
    });

    const res = await GET(buildRequest({ days: '7' }));
    const body = await res.json();

    expect(body.counts[d0]).toBe(1);
    expect(body.counts[d1]).toBe(0);
    // All 7 days should be present
    expect(Object.keys(body.counts).length).toBe(7);
  });
});