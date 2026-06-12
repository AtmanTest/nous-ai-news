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

      {/* Auto Evolve Widget */}
      <WidgetCard title="Auto Evolve">
        <div className="px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[15px] font-medium">Pipeline CI/CD autonome</span>
          </div>
          <p className="text-[13px] text-muted-foreground">Lance les tests, corrige les bugs, pousse en prod</p>
          <p className="text-[13px] text-muted-foreground">Dernier run : il y a 2h · v2.14.3</p>
          <Link href="/auto-tune" className="inline-flex items-center gap-1 text-[15px] text-primary hover:underline mt-1">
            Voir Auto Evolve <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </WidgetCard>

      {/* IA AUTO NEWS Widget */}
      <WidgetCard title="DeepMind">
        <div className="px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[15px] font-medium">Philosophe IA actif</span>
          </div>
          <p className="text-[13px] text-muted-foreground">Analyse 20 Min + BBC + Google News → 2-3 essais philosophiques</p>
          <p className="text-[13px] text-muted-foreground">Généré quotidien à 6h00 · DALL-E 3 images</p>
          <Link href="/ia-auto-news" className="inline-flex items-center gap-1 text-[15px] text-pink-300 hover:underline mt-1">
            Lire les essais <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </WidgetCard>

      {/* Custom content slot */}
      {customContent}
    </aside>
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
