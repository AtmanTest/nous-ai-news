'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeroStory {
  id: string;
  title: string;
  summary: string;
  image_url: string | null;
  source_name: string;
  category: string;
  published_at: string;
  slug: string;
}

interface NewsHeroProps {
  stories?: HeroStory[];
}

export function NewsHero({ stories = [] }: NewsHeroProps) {
  const [current, setCurrent] = useState(0);
  const featured = stories[0];
  const secondary = stories.slice(1, 4);

  // Auto-rotate hero every 8 seconds
  useEffect(() => {
    if (stories.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % Math.min(stories.length, 5));
    }, 8000);
    return () => clearInterval(timer);
  }, [stories.length]);

  if (!featured) {
    return (
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered News Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              The Pulse of{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                Artificial Intelligence
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Real-time AI news from 30+ global sources. Curated, ranked, and delivered with intelligence.
            </p>
            <Link
              href="/trending"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
            >
              Explore Trending
              <TrendingUp className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50 z-10" />

      {/* Hero image background */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Featured Story */}
          <div className="lg:col-span-3">
            <Link href={`/article/${featured.slug}`} className="group block">
              <div className="aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-muted">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {featured.image_url ? (
                    <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-sm">Featured Story</span>
                  )}
                </div>
              </div>
              <Badge variant="default" className="mb-3">
                {featured.category}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              <p className="text-muted-foreground line-clamp-2">{featured.summary}</p>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span>{featured.source_name}</span>
                <span>·</span>
                <span>{featured.published_at}</span>
              </div>
            </Link>
          </div>

          {/* Secondary Stories */}
          <div className="lg:col-span-2 space-y-4">
            {secondary.map((story, i) => (
              <Link
                key={story.id}
                href={`/article/${story.slug}`}
                className={cn(
                  "group flex gap-4 p-3 rounded-xl hover:bg-accent/50 transition-all",
                  i === current ? "bg-accent/30" : ""
                )}
              >
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-[10px] px-1.5 py-0">
                    {story.category}
                  </Badge>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {story.title}
                  </h3>
                  <span className="text-xs text-muted-foreground mt-1 block">{story.source_name}</span>
                </div>
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
                </div>
              </Link>
            ))}
            <Link
              href="/trending"
              className="flex items-center gap-2 text-sm text-primary hover:underline pt-2"
            >
              View all stories <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
