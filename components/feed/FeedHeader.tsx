'use client';

import { Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FeedHeaderProps {
  title: string;
  tabs?: { label: string; value: string }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  showBack?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
}

export function FeedHeader({ title, tabs, activeTab, onTabChange, showBack, showSettings, onBack }: FeedHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/65 backdrop-blur-xl border-b border-border/40">
      {/* Brand row */}
      <div className="px-4 pt-2 pb-1">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Daily AI News</span>
      </div>

      {/* Title row */}
      <div className="flex items-center justify-between px-4 h-[53px]">
        <div className="flex items-center gap-4">
          {showBack && (
            <button onClick={onBack} className="p-1 rounded-full hover:bg-accent/30 transition-colors">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/search" className="p-2 rounded-full hover:bg-accent/30 transition-colors">
            <Search className="h-5 w-5" />
          </Link>
          {showSettings && (
            <Link href="/settings" className="p-2 rounded-full hover:bg-accent/30 transition-colors">
              <Settings className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Tabs row */}
      {tabs && tabs.length > 0 && (
        <div className="flex overflow-x-auto scrollbar-none px-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange?.(tab.value)}
              className={cn(
                'flex-1 min-w-[80px] px-4 py-4 text-center text-[15px] transition-colors relative',
                activeTab === tab.value
                  ? 'font-bold text-foreground'
                  : 'font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10'
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
