'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Hash, Radio, Sparkles, ExternalLink, Search as SearchIcon, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LatestModels } from '@/components/news/LatestModels';

interface RightPanelProps {
  trending?: { title: string; id: string; score?: number; source_name?: string; trend_count?: number }[];
  topics?: string[];
  customContent?: React.ReactNode;
}

export function RightPanel({ trending = [], topics = [], customContent }: RightPanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <aside className="sticky top-0 h-dvh overflow-y-auto scrollbar-none py-1 pr-2 pl-4 space-y-4">
      {/* Search bar — sticky top */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI News"
            className="w-full h-[42px] pl-11 pr-4 rounded-full border border-transparent bg-secondary text-[15px] placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:bg-background transition-all"
          />
        </form>
      </div>

      {/* Trending Widget */}
      {trending.length > 0 && (
        <WidgetCard title="Trending AI Topics">
          {trending.slice(0, 5).map((item, i) => (
            <Link
              key={item.id}
              href={`/article/${item.id}`}
              className="flex flex-col gap-0.5 px-3 py-3 rounded-lg hover:bg-accent/20 transition-colors cursor-pointer group"
            >
              <span className="text-[13px] text-muted-foreground">
                {String(i + 1).padStart(2, '0')} · Trending
              </span>
              <span className="text-[15px] font-bold group-hover:underline leading-snug">
                {item.title}
              </span>
              {item.score && (
                <span className="text-[13px] text-muted-foreground">
                  {item.source_name} · {Math.round(item.score * 100)} posts
                </span>
              )}
            </Link>
          ))}
          <Link href="/trending" className="block px-3 py-3 text-[15px] text-primary hover:bg-accent/20 rounded-lg transition-colors">
            Show more
          </Link>
        </WidgetCard>
      )}

      {/* Latest Models Widget — dynamic from Supabase */}
      <LatestModels />

      {/* Daily AI NEWS — top trending stories */}
      <DailyAiNewsFeed />

      {/* Custom content slot */}
      {customContent}
    </aside>
  );
}

function DailyAiNewsFeed() {
  const [items, setItems] = useState<{ id: string; title: string; source_name?: string; published_at?: string; score?: number; image_url?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    let cancelled = false;
    const set = (raw: unknown) => {
      if (cancelled) return;
      let arr: { id: string; title: string; source_name?: string; published_at?: string; score?: number; image_url?: string }[] = [];
      if (Array.isArray(raw)) arr = raw as any;
      else if (raw && typeof raw === 'object' && Array.isArray((raw as any).articles)) arr = (raw as any).articles as any;
      setItems(arr);
    };
    fetch('/api/news?tab=trending&limit=6')
      .then(r => r.json())
      .then(data => set(data))
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  });

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Daily AI NEWS</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Daily AI NEWS</h3>
      </div>
      <div className="space-y-1 px-2 pb-4">
        {items.map((article, i) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className="group flex items-start gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
          >
            <span className="text-base font-bold text-primary/60 shrink-0 w-7 leading-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <span className="font-medium">{article.source_name}</span>
                <span>·</span>
                <span suppressHydrationWarning>
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </span>
                {article.score && article.score > 50 && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                    {article.score}
                  </span>
                )}
              </div>
            </div>
            {article.image_url && (
              <img
                src={article.image_url}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0 hidden sm:block"
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function WidgetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-secondary/80 border border-border/40 overflow-hidden">
      <h3 className="text-xl font-extrabold px-4 pt-4 pb-2">{title}</h3>
      {children}
    </div>
  );
}
