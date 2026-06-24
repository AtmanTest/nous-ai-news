'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Search, Settings, Sparkles, Calendar, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/feed', label: 'Feed', icon: Calendar, gradient: false },
  { href: '/daily', label: 'Daily', icon: Calendar, gradient: false },
  { href: '/trending', label: 'Trending', icon: TrendingUp, gradient: false },
  { href: '/ia-auto-news', label: 'DeepMind', icon: Brain, gradient: true },
  { href: '/search', label: 'Search', icon: Search, gradient: false },
  { href: '/auto-tune', label: 'Auto Evolve', icon: Sparkles, gradient: true },
  { href: '/settings', label: 'Settings', icon: Settings, gradient: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          const isDeepMind = item.href === '/ia-auto-news';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[48px] px-2 py-1.5 rounded-lg transition-colors',
                isDeepMind
                  ? isActive
                    ? 'bg-black text-white'
                    : 'text-muted-foreground hover:text-foreground'
                  : isActive
                    ? item.gradient
                      ? 'text-blue-400'
                      : 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-all', isActive && 'scale-110', isDeepMind && 'text-pink-400')} />
              <span className={cn('text-[10px] font-medium', (isActive || isDeepMind) && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
