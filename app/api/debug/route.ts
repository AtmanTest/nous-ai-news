import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const errors: string[] = [];

  // Check env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) errors.push('NEXT_PUBLIC_SUPABASE_URL missing');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) errors.push('SUPABASE_SERVICE_ROLE_KEY missing');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY missing');

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors });
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title')
      .eq('status', 'published')
      .order('score', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({
      ok: true,
      env: { url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) + '...' },
      articles: data?.length || 0,
      firstTitle: data?.[0]?.title?.slice(0, 50),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, catch: String(err) });
  }
}
