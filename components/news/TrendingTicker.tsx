'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';

interface TrendingItem {
  title: string;
  slug: string;
  momentum: number;
}

interface TrendingTickerProps {
  items?: TrendingItem[];
}

export function TrendingTicker({ items = [] }: TrendingTickerProps) {
  const defaultItems: TrendingItem[] = [
    { title: 'GPT-5 Capabilities Revealed', slug: 'gpt-5-capabilities-revealed', momentum: 98 },
    { title: 'Claude 4 Beats GPT-5 on Benchmarks', slug: 'claude-4-benchmarks', momentum: 95 },
    { title: 'EU Passes AI Regulation Act', slug: 'eu-ai-regulation', momentum: 92 },
    { title: 'Open Source Model Beats GPT-4 on Coding', slug: 'open-source-coding-benchmark', momentum: 88 },
    { title: 'Google Launches Gemini Ultra 2', slug: 'gemini-ultra-2', momentum: 85 },
  ];

  const trending = items.length > 0 ? items : defaultItems;
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPos((prev) => (prev + 1) % trending.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [trending.length]);

  return (
    <div className="border-b border-border/40 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-2 overflow-hidden">
          <div className="flex items-center gap-2 text-orange-500 flex-shrink-0">
            <Flame className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Trending</span>
          </div>

          {/* Desktop: show all items in a scroll */}
          <div className="hidden md:flex items-center gap-6 overflow-x-auto no-scrollbar">
            {trending.slice(0, 5).map((item) => (
              <Link
                key={item.slug}
                href={`/article/${item.slug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
                <span>{item.title}</span>
                <span className="text-orange-500 text-xs font-medium">{item.momentum}</span>
              </Link>
            ))}
          </div>

          {/* Mobile: animated single item */}
          <div className="md:hidden flex-1 overflow-hidden relative h-5">
            <div
              className="absolute inset-0 transition-all duration-500 ease-in-out"
              style={{ transform: `translateY(-${scrollPos * 100}%)` }}
            >
              {trending.slice(0, 3).map((item) => (
                <Link
                  key={item.slug}
                  href={`/article/${item.slug}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground h-5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
                  <span className="truncate">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
