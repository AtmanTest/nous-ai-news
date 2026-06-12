import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
import { resend } from '@/lib/resend';

const subscribeSchema = z.object({
  email: z.string().email(),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    topics: z.array(z.string()).optional(),
  }).optional(),
});

function generateToken() {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, frequency, preferences } = parsed.data;
    const supabase = await createAdminClient();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('id, confirmed')
      .eq('email', email)
      .maybeSingle();

    const confirmToken = generateToken();
    const unsubscribeToken = generateToken();

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({
          frequency,
          preferences: preferences || {},
          confirm_token: confirmToken,
          unsubscribe_token: unsubscribeToken,
          confirmed: false, // Re-confirm on resubscribe
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        console.error('Newsletter update error:', error);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email,
          frequency,
          preferences: preferences || {},
          confirm_token: confirmToken,
          unsubscribe_token: unsubscribeToken,
        });

      if (error) {
        console.error('Newsletter insert error:', error);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
    }

    // Send confirmation email
    const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nous-daily.vercel.app'}/newsletter/confirm?token=${confirmToken}`;

    if (resend) {
      await resend.emails.send({
        from: 'Nous AI News <newsletter@nous-daily.vercel.app>',
        to: [email],
        subject: 'Confirm your Nous AI News subscription',
        html: `
          <h1>Welcome to Nous AI News!</h1>
          <p>Confirm your subscription to receive ${frequency} AI news digests.</p>
          <p><a href="${confirmUrl}">Confirm subscription</a></p>
          <p>If you didn't request this, you can ignore this email.</p>
        `,
      });
    }

    return NextResponse.json({ success: true, message: 'Confirmation email sent' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}