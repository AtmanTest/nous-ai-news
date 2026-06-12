import { Metadata } from 'next';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyFeed } from '@/components/feed/DailyFeed';

export const metadata: Metadata = {
  title: 'Daily Feed | Daily AI',
  description: 'Browse AI news chronologically by day. Scroll through the past week of articles.',
  openGraph: {
    title: 'Daily Feed | Daily AI',
    description: 'Browse AI news chronologically by day. Scroll through the past week of articles.',
    type: 'website',
  },
};

export default function DailyPage() {
  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-[53px] px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Daily Feed</h1>
          </div>
          <p className="hidden sm:block text-sm text-muted-foreground">
            Scroll through the past week — newest first
          </p>
        </div>
      </header>

      {/* Feed */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto w-full">
          <DailyFeed />
        </div>
      </main>

      {/* Bottom spacer for mobile */}
      <div className="md:hidden h-16" />
    </div>
  );
}