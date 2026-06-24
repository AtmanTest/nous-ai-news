'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { NewsCard } from '@/components/feed/NewsCard';
import { SkeletonCard } from '@/components/feed/SkeletonCard';
import { useFeed, type Article } from '@/hooks/useFeed';
import { useDayFilter } from '@/hooks/useDayFilter';
import { DayFilterBar } from '@/components/feed/DayFilterBar';
import { DayEmptyState } from '@/components/feed/DayEmptyState';
import { cn } from '@/lib/utils';
import { RefreshCw, AlertCircle, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'framer-motion';

// Helper to create UTC date at midnight for a given offset from today (UTC)
function getUtcDateString(offsetDays: number): string {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utcDate.setUTCDate(utcDate.getUTCDate() - offsetDays);
  return utcDate.toISOString().split('T')[0];
}

const TABS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Trending', value: 'trending' },
  { label: 'For You', value: 'for-you' },
];

function LoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/40">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
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

function FeedEmpty({ tab, isLoggedIn }: { tab: string; isLoggedIn: boolean }) {
  const messages: Record<string, { title: string; desc: string }> = {
    'latest': {
      title: 'No articles yet',
      desc: 'Check back soon for the latest AI news.',
    },
    'trending': {
      title: 'No trending articles',
      desc: 'Nothing is trending right now. Check back later.',
    },
    'for-you': {
      title: isLoggedIn ? 'No personalized articles' : 'Sign in for personalized recommendations',
      desc: isLoggedIn
        ? 'Follow topics and sources to build your feed.'
        : 'Your For You feed will show articles tailored to your interests after signing in.',
    },
  };

  const msg = messages[tab] || messages['latest'];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <h3 className="text-lg font-semibold mb-1">{msg.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{msg.desc}</p>
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
 * TabbedNewsFeed — the main feed with URL-controlled tabs and day filter.
 *
 * Uses useFeed hook which reads ?tab= and ?date= from the URL.
 * Tabs: Latest, Trending, For You
 * For You shows Latest if guest, or personalized if logged in.
 * Day filter: horizontal scrollable chips for 7 days.
 */
export function TabbedNewsFeed() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const date = searchParams.get('date') || undefined;

  const {
    articles,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    activeTab,
    setTab,
    loadMore,
    refresh,
  } = useFeed();

  const { days, goToPreviousDay, goToNextDay, canGoNext, canGoPrevious } = useDayFilter();

  const handleTabChange = useCallback((value: string) => {
    setTab(value as 'latest' | 'trending' | 'for-you');
  }, [setTab]);

  const handleRetry = useCallback(() => {
    refresh();
  }, [refresh]);

  const isLoggedIn = !!user;

  // For navigation buttons in empty state
  const handlePrevDay = useCallback(() => {
    goToPreviousDay();
  }, [goToPreviousDay]);

  const handleNextDay = useCallback(() => {
    goToNextDay();
  }, [goToNextDay]);

  return (
    <div className="max-w-3xl mx-auto w-full">
      <FeedHeader
        title={isLoggedIn && activeTab === 'for-you' ? 'For You' : activeTab === 'trending' ? 'Trending' : 'Latest'}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showSettings
      />

      {/* Day Filter Bar */}
      <DayFilterBar
        selectedDate={date || getUtcDateString(0)}
        onDateChange={(d) => {
          const params = new URLSearchParams(searchParams.toString());
          const todayStr = getUtcDateString(0);
          if (d === todayStr) {
            params.delete('date');
          } else {
            params.set('date', d);
          }
          const query = params.toString();
          const newUrl = query ? `${pathname}?${query}` : pathname;
          router.replace(newUrl, { scroll: false });
        }}
      />

      {/* Loading state — initial load */}
      {isLoading && (
        <LoadingSkeleton count={6} />
      )}

      {/* Error state */}
      {!isLoading && error && (
        <FeedError message={error} onRetry={handleRetry} />
      )}

      {/* Empty state for specific day */}
      {!isLoading && !error && articles.length === 0 && date && (
        <DayEmptyState date={date} onGoToPreviousDay={handlePrevDay} />
      )}

      {/* Empty state for general feed */}
      {!isLoading && !error && articles.length === 0 && !date && (
        <FeedEmpty tab={activeTab} isLoggedIn={isLoggedIn} />
      )}

      {/* Articles list with AnimatePresence for date transitions */}
      {!isLoading && !error && articles.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={date || 'latest'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="divide-y divide-border/40">
              {articles.map((article: Article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <NewsCard
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
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Load more trigger / loading more */}
      {!isLoading && hasMore && articles.length > 0 && (
        <InfiniteScrollTrigger onLoadMore={loadMore} isLoading={isLoadingMore} />
      )}

      {isLoadingMore && (
        <div className="py-4 flex justify-center">
          <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          <span className="sr-only">Loading more articles...</span>
        </div>
      )}

      {/* End of feed */}
      {!isLoading && !hasMore && articles.length > 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          You&apos;re all caught up ✨
        </div>
      )}

      {/* Pull-to-refresh style button at top */}
      {!isLoading && articles.length > 0 && (
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
    </div>
  );
}