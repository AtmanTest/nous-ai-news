'use client';

import { useState } from 'react';
import { Activity, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  id: string;
  text: string;
  source: string;
  platform: 'twitter' | 'reddit' | 'hackernews' | 'discord' | 'telegram';
  momentum: number;
  timestamp: string;
  url: string;
}

interface LiveSignalPanelProps {
  signals?: Signal[];
}

export function LiveSignalPanel({ signals = [] }: LiveSignalPanelProps) {
  const defaultSignals: Signal[] = [
    { id: '1', text: 'GPT-5 internal testing reportedly shows 10x improvement in reasoning', source: 'Twitter', platform: 'twitter', momentum: 95, timestamp: '2m ago', url: '#' },
    { id: '2', text: 'New open source model surpasses Llama 3 on coding benchmarks', source: 'Reddit r/LocalLLaMA', platform: 'reddit', momentum: 88, timestamp: '5m ago', url: '#' },
    { id: '3', text: 'Anthropic announces Claude 4 API price reduction by 40%', source: 'Hacker News', platform: 'hackernews', momentum: 82, timestamp: '12m ago', url: '#' },
    { id: '4', text: 'EU AI Act implementation timeline published — key dates inside', source: 'Discord', platform: 'discord', momentum: 76, timestamp: '18m ago', url: '#' },
    { id: '5', text: 'Runway Gen-4 Alpha shows photorealistic video generation', source: 'Twitter', platform: 'twitter', momentum: 91, timestamp: '22m ago', url: '#' },
  ];

  const items = signals.length > 0 ? signals : defaultSignals;
  const [visibleCount, setVisibleCount] = useState(3);

  const platformColors = {
    twitter: 'text-sky-500',
    reddit: 'text-orange-500',
    hackernews: 'text-orange-600',
    discord: 'text-indigo-500',
    telegram: 'text-blue-500',
  };

  const momentumColor = (m: number) => {
    if (m >= 90) return 'text-red-500';
    if (m >= 80) return 'text-orange-500';
    if (m >= 70) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Live Signals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Signals */}
      <div className="divide-y divide-border/20">
        {items.slice(0, visibleCount).map((signal) => (
          <a
            key={signal.id}
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 hover:bg-accent/30 transition-colors group"
          >
            <p className="text-sm mb-1.5 line-clamp-2">{signal.text}</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', platformColors[signal.platform])}>
                  {signal.source}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{signal.timestamp}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className={cn('h-3 w-3', momentumColor(signal.momentum))} />
                <span className={cn('font-medium', momentumColor(signal.momentum))}>
                  {signal.momentum}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Show more button */}
      {items.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(visibleCount + 3)}
          className="w-full py-2 text-xs text-primary hover:bg-accent/30 transition-colors font-medium"
        >
          Show {Math.min(3, items.length - visibleCount)} more signals
        </button>
      )}
    </div>
  );
}
