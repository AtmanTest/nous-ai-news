import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const frequency = body.frequency || 'daily'; // 'daily' or 'weekly'

    const supabase = await createAdminClient();

    // Get time range
    const now = new Date();
    const startDate = new Date(now);
    if (frequency === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch confirmed subscriptions for this frequency
    const { data: subscriptions, error: subError } = await supabase
      .from('newsletter_subscriptions')
      .select('email, preferences')
      .eq('frequency', frequency)
      .eq('confirmed', true);

    if (subError) {
      console.error('Fetch subscriptions error:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscribers' });
    }

    // Fetch articles for the period
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, summary, url, source, published_at, category, entities')
      .gte('published_at', startDate.toISOString())
      .lte('published_at', now.toISOString())
      .order('published_at', { ascending: false })
      .limit(50);

    if (articlesError) {
      console.error('Fetch articles error:', articlesError);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    // Group articles by category
    const articlesByCategory = (articles || []).reduce((acc, article) => {
      const cat = article.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {} as Record<string, typeof articles>);

    // Generate HTML email
    const dateStr = format(now, 'EEEE, MMMM d, yyyy');
    const html = generateNewsletterHTML(articlesByCategory, dateStr, frequency);

    // Send to all subscribers
    if (!resend) {
      console.warn('Resend not configured, skipping email send');
      return NextResponse.json({ success: true, sent: 0, message: 'Resend not configured' });
    }

    const emails = subscriptions.map((s) => ({
      from: 'Nous AI News <newsletter@nous-daily.vercel.app>',
      to: [s.email],
      subject: `${frequency === 'daily' ? 'Daily' : 'Weekly'} AI News Digest — ${dateStr}`,
      html,
    }));

    // Send in batches (Resend limit)
    const batchSize = 50;
    let sent = 0;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.all(batch.map((email) => resend!.emails.send(email)));
      sent += batch.length;
    }

    return NextResponse.json({ success: true, sent, frequency, date: dateStr });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateNewsletterHTML(
  articlesByCategory: Record<string, any[]>,
  dateStr: string,
  frequency: string
): string {
  const categories = Object.entries(articlesByCategory);
  
  let categoryHtml = '';
  for (const [cat, articles] of categories) {
    categoryHtml += `
      <h2 style="color: #8b5cf6; margin-top: 32px; margin-bottom: 16px; font-size: 18px; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;">
        ${cat} (${articles.length})
      </h2>
    `;
    
    for (const article of articles.slice(0, 10)) {
      categoryHtml += `
        <div style="margin-bottom: 20px; padding: 16px; background: #1e1e1e; border-radius: 8px; border: 1px solid #333;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600;">
            <a href="${article.url}" style="color: #fff; text-decoration: none;">${article.title}</a>
          </h3>
          <p style="margin: 8px 0 0 0; color: #aaa; font-size: 13px; line-height: 1.5;">${article.summary || ''}</p>
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            ${article.source} • ${new Date(article.published_at).toLocaleDateString()}
          </div>
        </div>
      `;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #333;">
          <h1 style="margin: 0; font-size: 24px; background: linear-gradient(135deg, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            Nous AI News
          </h1>
          <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">
            ${frequency === 'daily' ? 'Daily' : 'Weekly'} Digest — ${dateStr}
          </p>
        </div>

        <!-- Articles -->
        <div style="padding: 24px 0;">
          ${categoryHtml || '<p style="color: #888; text-align: center;">No articles for this period.</p>'}
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #333; padding-top: 24px; text-align: center; color: #666; font-size: 12px;">
          <p>You received this because you subscribed to Nous AI News.</p>
          <p>
            <a href="{{unsubscribe_url}}" style="color: #8b5cf6;">Unsubscribe</a> •
            <a href="https://nous-daily.vercel.app" style="color: #8b5cf6;">Visit Site</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}