import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const limit = parseInt(searchParams.get('limit') || '4', 10);

  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  try {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const url = `${supabaseUrl}/rest/v1/articles?select=id,title,summary,image_url,source_name,category,tags,published_at,score,is_breaking&status=eq.published&id=neq.${id}&order=score.desc.nullslast&limit=${limit}`;

    const res = await fetch(url, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });

    if (!res.ok) return NextResponse.json({ error: 'supabase error' }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
