import { Metadata } from 'next';
import Link from 'next/link';
import { Flame, Zap, Clock } from 'lucide-react';
import { RefreshButton } from '@/components/news/RefreshButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Trending AI News',
  description: 'The most popular and trending AI news stories right now.',
};

interface Article {
  id: string;
  title: string;
  category: string | null;
  source_name: string;
  published_at: string;
  score: number | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function getTrending(): Promise<Article[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const url = `${supabaseUrl}/rest/v1/articles?select=id,title,category,source_name,published_at,score&status=eq.published&order=score.desc.nullslast&limit=20`;
    const res = await fetch(url, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function TrendingPage() {
  const articles = await getTrending();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Trending Now</h1>
          <p className="text-sm text-muted-foreground">Top AI stories ranked by popularity</p>
        </div>
        <div className="ml-auto">
          <RefreshButton />
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No trending stories available right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((item, i) => (
            <Link
              key={item.id}
              href={`/article/${item.id}`}
              className="group flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card hover:border-primary/30 hover:bg-accent/30 transition-all"
            >
              <span className="text-2xl font-bold text-muted-foreground/30 group-hover:text-primary/50 transition-colors w-8 text-right">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.category || 'General'}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.source_name}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{timeAgo(item.published_at)}</span>
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>
              {item.score != null && (
                <div className="flex items-center gap-1 text-orange-500 text-sm">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">{Math.round(item.score)}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
