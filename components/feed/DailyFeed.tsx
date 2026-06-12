'use client';

import { useRef, useEffect } from 'react';
import { RefreshCw, AlertCircle, Inbox, ChevronDown } from 'lucide-react';
import { NewsCard } from '@/components/feed/NewsCard';
import { useDailyFeed, type DailyDay, type DailyArticle } from '@/hooks/useDailyFeed';
import { cn } from '@/lib/utils';

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/40">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="py-4">
          <div className="h-6 bg-muted animate-pulse rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function DaySkeleton() {
  return (
    <div className="py-4">
      <div className="h-6 bg-muted animate-pulse rounded w-1/4 mb-4" />
      <LoadingSkeleton count={3} />
    </div>
  );
}

function FeedError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="h-10 w-10 text-destructive/60 mb-3" />
      <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

function FeedEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <h3 className="text-lg font-semibold mb-1">No articles yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">Check back soon for the latest AI news.</p>
    </div>
  );
}

function DayHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 border-b border-border/40">
      <div className="flex items-center gap-3 px-4">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">{label}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
          {count} article{count !== 1 ? 's' : ''}
        </span>
        <div className="h-px flex-1 bg-border/40" />
      </div>
    </div>
  );
}

function InfiniteScrollTrigger({ onLoadMore, isLoading }: { onLoadMore: () => void; isLoading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, isLoading]);

  return <div ref={ref} className="h-4" />;
}

/**
 * DailyFeed — chronological feed grouped by date (day buckets).
 * Infinite scroll loads older days (up to 7 days back).
 * No tabs, just one continuous timeline.
 */
export function DailyFeed() {
  const {
    days,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = useDailyFeed();

  // Flatten for virtualization if needed later
  const totalArticles = days.reduce((sum, day) => sum + day.articles.length, 0);

  return (
    <div className="flex flex-col">
      {/* Pull-to-refresh style button at top */}
      {!isLoading && totalArticles > 0 && (
        <div className="flex justify-center py-2 border-b border-border/40">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      )}

      {/* Loading state — initial load */}
      {isLoading && (
        <div className="divide-y divide-border/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <DaySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <FeedError message={error} onRetry={refresh} />
      )}

      {/* Empty state */}
      {!isLoading && !error && totalArticles === 0 && (
        <FeedEmpty />
      )}

      {/* Daily grouped feed */}
      {!isLoading && !error && totalArticles > 0 && (
        <div className="divide-y divide-border/40">
          {days.map((day: DailyDay) => (
            <div key={day.date} className="py-2">
              <DayHeader label={day.label} count={day.articles.length} />
              <div className="space-y-1">
                {day.articles.map((article: DailyArticle) => (
                  <NewsCard
                    key={article.id}
                    id={article.id}
                    slug={article.id}
                    title={article.title}
                    summary={article.summary}
                    image_url={article.image_url}
                    source_name={article.source_name}
                    category={article.category}
                    tags={article.tags || []}
                    published_at={article.published_at}
                    score={article.score}
                    is_breaking={article.is_breaking}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more trigger */}
      {!isLoading && hasMore && totalArticles > 0 && (
        <InfiniteScrollTrigger onLoadMore={loadMore} isLoading={isLoadingMore} />
      )}

      {isLoadingMore && (
        <div className="py-4 flex justify-center">
          <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          <span className="sr-only">Loading older days...</span>
        </div>
      )}

      {/* End of feed */}
      {!isLoading && !hasMore && totalArticles > 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          You&apos;ve reached the beginning of the week ✨
        </div>
      )}
    </div>
  );
}