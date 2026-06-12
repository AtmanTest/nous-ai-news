import { Suspense } from 'react';
import { Metadata } from 'next';
import { TabbedNewsFeed } from '@/components/feed/TabbedNewsFeed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI News Feed',
  description: 'Latest, trending, and personalized AI news feed.',
};

export default function FeedPage() {
  return (
    <div className="animate-fade-in">
      <Suspense fallback={<FeedPageFallback />}>
        <TabbedNewsFeed />
      </Suspense>
    </div>
  );
}

function FeedPageFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-[53px] border-b border-border/40 bg-background/65" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-border/40">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-accent rounded" />
              <div className="h-3 w-20 bg-accent rounded" />
            </div>
          </div>
          <div className="space-y-2 ml-[52px]">
            <div className="h-4 w-full bg-accent rounded" />
            <div className="h-4 w-3/4 bg-accent rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
