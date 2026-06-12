import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const unsubscribeSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid token', details: parsed.error.flatten() }, { status: 400 });
    }

    const { token } = parsed.data;
    const supabase = await createAdminClient();

    // Find and delete subscription by unsubscribe token
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .delete()
      .eq('unsubscribe_token', token);

    if (error) {
      console.error('Newsletter unsubscribe error:', error);
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}