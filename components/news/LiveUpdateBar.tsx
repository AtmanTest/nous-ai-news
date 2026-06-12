'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const POLL_INTERVAL = 60_000; // 60 seconds

export function LiveUpdateBar({ initialTimestamp }: { initialTimestamp: string }) {
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkForUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-check?since=${encodeURIComponent(initialTimestamp)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.count > 0) {
        setCount(data.count);
      }
    } catch {
      // Silently fail — polling is best-effort
    }
  }, [initialTimestamp]);

  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (count === 0 || dismissed) return null;

  return (
    <div
      className={cn(
        'sticky top-[var(--header-height,57px)] z-40 w-full',
        'bg-primary/10 backdrop-blur-md border-b border-primary/20',
        'transition-all duration-300',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            'flex items-center gap-2 text-sm font-medium text-primary',
            'hover:text-primary/80 transition-colors',
            isRefreshing && 'opacity-50 cursor-not-allowed',
          )}
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          {count === 1
            ? '1 new article available — Refresh'
            : `${count} new articles available — Refresh`}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
