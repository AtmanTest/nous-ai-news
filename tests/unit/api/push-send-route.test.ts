import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

const setVapidDetails = vi.fn();
const sendNotification = vi.fn();
vi.mock('web-push', () => ({
  default: {
    setVapidDetails,
    sendNotification,
  },
}));

async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/push/send/route');
}

function request(body: unknown, headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/push/send', () => {
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

  it('returns 401 when CRON_SECRET is configured and authorization is wrong', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');
    const { POST } = await loadRoute();

    const response = await POST(request({ title: 'Hi', body: 'Body', url: 'https://nous-daily.vercel.app' }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 for invalid payload before touching push configuration', async () => {
    const { POST } = await loadRoute();

    const response = await POST(request({ title: '', body: '' }));
    expect(response.status).toBe(400);
    expect(setVapidDetails).not.toHaveBeenCalled();
  });

  it('returns 503 instead of crashing when VAPID keys are not configured', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');

    const { POST } = await loadRoute();
    const response = await POST(request({ title: 'Hi', body: 'Body', url: 'https://nous-daily.vercel.app' }));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toBe('Push notifications are not configured');
    expect(setVapidDetails).not.toHaveBeenCalled();
  });

  it('sends to matching subscriptions and reports successes', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'public');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private');
    const selectPromise = Promise.resolve({
      data: [
        { endpoint: 'https://push/1', p256dh: 'p1', auth: 'a1', topics: ['ai'], user_id: 'u1' },
        { endpoint: 'https://push/2', p256dh: 'p2', auth: 'a2', topics: ['other'], user_id: 'u2' },
      ],
      error: null,
    });
    vi.mocked(createAdminClient).mockResolvedValue({
      from: vi.fn(() => ({ select: vi.fn(() => selectPromise) })),
    } as any);
    sendNotification.mockResolvedValue(undefined);

    const { POST } = await loadRoute();
    const response = await POST(request({
      title: 'AI',
      body: 'News',
      url: 'https://nous-daily.vercel.app/feed',
      topics: ['ai'],
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, sent: 1, failed: 0, expiredCleaned: 0 });
    expect(setVapidDetails).toHaveBeenCalledWith('mailto:thasin@live.com', 'public', 'private');
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when subscription fetch fails', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'public');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private');
    vi.mocked(createAdminClient).mockResolvedValue({
      from: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB failed' } })) })),
    } as any);

    const { POST } = await loadRoute();
    const response = await POST(request({ title: 'AI', body: 'News', url: 'https://nous-daily.vercel.app/feed' }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to fetch subscriptions' });
  });
});
