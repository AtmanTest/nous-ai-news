import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const confirmSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid token', details: parsed.error.flatten() }, { status: 400 });
    }

    const { token } = parsed.data;
    const supabase = await createAdminClient();

    // Find subscription by confirm token
    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email')
      .eq('confirm_token', token)
      .maybeSingle();

    if (findError || !subscription) {
      return NextResponse.json({ error: 'Invalid or expired confirmation token' }, { status: 404 });
    }

    // Mark as confirmed and clear confirm token
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({
        confirmed: true,
        confirm_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      console.error('Newsletter confirm error:', error);
      return NextResponse.json({ error: 'Failed to confirm subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscription confirmed' });
  } catch (error) {
    console.error('Newsletter confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}