import { NextResponse } from 'next/server';
import { aggregateSocialSignals } from '@/lib/social/normalize';

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const signals = await aggregateSocialSignals();
    return NextResponse.json(signals, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API Social] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social signals', posts: [], trending_topics: [] },
      { status: 500 }
    );
  }
}
