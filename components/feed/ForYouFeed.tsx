'use client';

import { useRef } from 'react';
import { RefreshCw, AlertCircle, Inbox, Sparkles, Target } from 'lucide-react';
import { NewsCard } from '@/components/feed/NewsCard';
import { useForYouFeed, useForYouInfiniteScroll, ForYouArticle } from '@/hooks/useForYouFeed';

interface ForYouFeedProps {
  limit?: number;
  showEmptyMessage?: boolean;
}

export function ForYouFeed({ limit = 20, showEmptyMessage = true }: ForYouFeedProps) {
  const {
    articles,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    personalized,
    refresh,
    loadMore,
  } = useForYouFeed({ limit });

  const triggerRef = useForYouInfiniteScroll(loadMore, hasMore, isLoadingMore);

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading For You feed">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-3 pl-[52px]">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
            <div className="h-4 w-1/3 bg-muted rounded" />
            <div className="h-32 w-full bg-muted rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <h3 className="text-lg font-semibold">Unable to load For You feed</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    if (!showEmptyMessage) return null;
    
    return (
      <div className="text-center py-12 space-y-4">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <h3 className="text-lg font-semibold">
          {personalized ? 'No personalized recommendations yet' : 'No trending articles'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {personalized
            ? 'Start reading articles to get personalized recommendations based on your interests.'
            : 'Check back later for trending AI news.'}
        </p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <NewsCard
          key={article.id}
          id={article.id}
          slug={article.slug}
          title={article.title}
          summary={article.summary}
          image_url={article.image_url}
          source_name={article.source_name}
          category={article.category}
          published_at={article.published_at}
          score={article.score}
        />
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div
          ref={triggerRef}
          className="py-4 text-center"
          role="status"
          aria-label={isLoadingMore ? 'Loading more articles' : 'Scroll to load more'}
        >
          {isLoadingMore && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading more recommendations...
            </div>
          )}
        </div>
      )}

      {/* Caught up message */}
      {!hasMore && articles.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            You&apos;re all caught up!
            {personalized && <span className="text-xs text-primary">Personalized</span>}
          </p>
        </div>
      )}
    </div>
  );
}

export function ForYouHeader({ personalized }: { personalized: boolean }) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">For You</h2>
          <p className="text-sm text-muted-foreground">
            {personalized
              ? 'Personalized recommendations based on your reading history'
              : 'Trending articles while you build your profile'}
          </p>
        </div>
      </div>
      {personalized && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
          <Sparkles className="h-3 w-3" />
          Personalized
        </span>
      )}
    </header>
  );
}