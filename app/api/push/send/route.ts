import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:thasin@live.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const sendSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(200),
  url: z.string().url().default('/'),
  topics: z.array(z.string()).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
});

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: string[];
  user_id: string;
}

async function sendToSubscription(subscription: PushSubscription, payload: object) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true, endpoint: subscription.endpoint };
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, endpoint: subscription.endpoint, reason: 'expired', shouldDelete: true };
    }
    console.error('Push send error:', error);
    return { success: false, endpoint: subscription.endpoint, reason: 'failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify internal/cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { title, body: bodyText, url, topics, userIds, icon, badge } = parsed.data;

    const supabase = await createAdminClient();

    // Build query
    let query = supabase.from('push_subscriptions').select('endpoint, p256dh, auth, topics, user_id');

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Fetch subscriptions error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Filter by topics if provided
    let filtered = subscriptions || [];
    if (topics && topics.length > 0) {
      filtered = filtered.filter((sub: PushSubscription) =>
        sub.topics && sub.topics.some((t: string) => topics.includes(t))
      );
    }

    // Send notifications in parallel
    const payload = {
      title,
      body: bodyText,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-192x192.png',
      url,
      data: { url },
      actions: [{ action: 'open', title: 'Open' }],
    };

    const results = await Promise.all(
      filtered.map((sub: PushSubscription) => sendToSubscription(sub, payload))
    );

    // Clean up expired subscriptions
    const expiredEndpoints = results
      .filter((r) => r.shouldDelete)
      .map((r) => r.endpoint);

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: results.length - successCount,
      expiredCleaned: expiredEndpoints.length,
    });
  } catch (error) {
    console.error('Push send API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}