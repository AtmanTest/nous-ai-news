import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const setVapidDetails = vi.fn();
vi.mock('web-push', () => ({
  default: {
    setVapidDetails,
  },
}));

async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/push/subscribe/route');
}

function request(body: unknown) {
  return new NextRequest('http://localhost/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function supabaseWithUser(user: any, authError: any = null, dbResult = { data: { id: 'sub-1' }, error: null }) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: authError }) },
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue(dbResult),
        })),
      })),
    })),
  };
}

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('can be imported during Next build without VAPID env vars', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');

    await expect(loadRoute()).resolves.toHaveProperty('POST');
    expect(setVapidDetails).not.toHaveBeenCalled();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(supabaseWithUser(null) as any);
    const { POST } = await loadRoute();

    const response = await POST(request({ endpoint: 'https://push/1', keys: { p256dh: 'p', auth: 'a' } }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 for invalid payload', async () => {
    vi.mocked(createClient).mockResolvedValue(supabaseWithUser({ id: 'user-1' }) as any);
    const { POST } = await loadRoute();

    const response = await POST(request({ endpoint: 'not-a-url', keys: { p256dh: '', auth: '' } }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('Invalid request');
  });

  it('upserts a valid subscription for the authenticated user', async () => {
    vi.mocked(createClient).mockResolvedValue(supabaseWithUser({ id: 'user-1' }, null, { data: { id: 'sub-1' }, error: null }) as any);
    const { POST } = await loadRoute();

    const response = await POST(request({
      endpoint: 'https://push/1',
      keys: { p256dh: 'p', auth: 'a' },
      topics: ['ai'],
      userAgent: 'test-agent',
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, subscription: { id: 'sub-1' } });
  });

  it('returns 500 when saving the subscription fails', async () => {
    vi.mocked(createClient).mockResolvedValue(supabaseWithUser({ id: 'user-1' }, null, { data: null, error: { message: 'DB failed' } }) as any);
    const { POST } = await loadRoute();

    const response = await POST(request({ endpoint: 'https://push/1', keys: { p256dh: 'p', auth: 'a' } }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to save subscription' });
  });
});
