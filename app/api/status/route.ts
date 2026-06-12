import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Lightweight status endpoint.
 * Returns last successful refresh time by checking GitHub Actions.
 */
export async function GET() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
  const repo = 'AtmanTest/nous-ai-news';

  try {
    // Fetch the most recent successful refresh-news workflow run
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/refresh-news.yml/runs?per_page=1&status=success`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, message: 'GitHub API error', status: res.status });
    }

    const data = await res.json();
    const runs = data.workflow_runs as Array<{ updated_at: string; created_at: string; run_number: number; html_url: string }> || [];

    if (runs.length === 0) {
      return NextResponse.json({ ok: true, lastRefresh: null, message: 'No successful runs yet' });
    }

    const latest = runs[0];
    return NextResponse.json({
      ok: true,
      lastRefresh: latest.updated_at,
      createdAt: latest.created_at,
      runNumber: latest.run_number,
      url: latest.html_url,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
