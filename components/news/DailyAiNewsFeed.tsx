'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export function DailyAiNewsFeed() {
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
      <div className="rounded-2xl bg-secondary/80 border border-border/40 overflow-hidden">
        <h3 className="text-xl font-extrabold px-4 pt-4 pb-2">Daily AI NEWS</h3>
        <div className="flex items-center justify-center py-8">
          <TrendingUp className="h-5 w-5 animate-spin text-muted-foreground" />
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
