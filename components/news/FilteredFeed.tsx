'use client';

import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { StoryCard } from '@/components/news/StoryCard';
import { useSourceFilter } from '@/hooks/useSourceFilter';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  category: string | null;
  tags: string[];
  published_at: string;
  score: number;
  is_breaking: boolean;
  content: string | null;
  language: string | null;
}

interface FilteredFeedProps {
  featured: Article[];
  latest: Article[];
  excludeIds?: string[];
  showEmptyMessage?: boolean;
}

export function FilteredFeed({ featured, latest, excludeIds = [], showEmptyMessage = true }: FilteredFeedProps) {
  const { hiddenSources, hideSource, showSource, showAllSources, ready } = useSourceFilter();
  const [showHidden, setShowHidden] = useState(false);

  const seenIds = new Set(excludeIds);

  // Build ready-state unfiltered — no source filter, no hidden sources check
  const readyFeatured = featured.filter(a => !seenIds.has(a.id)).slice(0, 4);
  const readyLatest = latest.filter(a => !seenIds.has(a.id));

  if (!ready) {
    return (
      <>
        {readyFeatured.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {readyFeatured.map((article, i) => (
              <StoryCard key={article.id} {...article} slug={article.id} is_featured={i === 0} variant={i === 0 ? 'featured' : 'default'} />
            ))}
          </div>
        )}
        <div className="space-y-1">
          {readyLatest.map((article) => (
            <StoryCard key={article.id} {...article} slug={article.id} variant="list" />
          ))}
        </div>
      </>
    );
  }

  // Dedup: exclude already-seen IDs, then exclude featured articles from latest
  const unfilteredFeatured = featured.filter(a => !seenIds.has(a.id));
  const seenInHero = new Set(unfilteredFeatured.slice(0, 4).map(a => a.id));
  const filteredFeatured = unfilteredFeatured.filter(a => !hiddenSources.has(a.source_name));
  const filteredLatest = latest.filter(a => !seenIds.has(a.id) && !seenInHero.has(a.id) && !hiddenSources.has(a.source_name));

  return (
    <>
      {/* Hidden sources bar */}
      {hiddenSources.size > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Hidden sources:</span>
          {Array.from(hiddenSources).map((src) => (
            <button
              key={src}
              onClick={() => showSource(src)}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
            >
              {src}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Featured grid */}
      {filteredFeatured.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {filteredFeatured.slice(0, 4).map((article, i) => (
            <StoryCard key={article.id} {...article} slug={article.id} is_featured={i === 0} variant={i === 0 ? 'featured' : 'default'} onHideSource={hideSource} />
          ))}
        </div>
      )}

      {/* Latest feed */}
      <div className="space-y-1">
        {filteredLatest.length > 0 ? (
          filteredLatest.map((article) => (
            <StoryCard key={article.id} {...article} slug={article.id} variant="list" onHideSource={hideSource} />
          ))
        ) : showEmptyMessage ? (
          <div className="text-center py-12 text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm mb-3">All articles are hidden by source filters.</p>
            <button
              onClick={() => showAllSources()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Show all sources
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
