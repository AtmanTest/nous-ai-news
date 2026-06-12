'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Bookmark, TrendingUp, Newspaper,
  Settings, Sparkles, User,
  MoreHorizontal, LogOut, LogIn, UserPlus,
  Calendar, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/daily', label: 'Daily', icon: Calendar },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/search', label: 'Explore', icon: Search },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings, always: true },
  { href: '/ia-auto-news', label: 'DeepMind', icon: Brain, gradient: true, always: true },
  { href: '/auto-tune', label: 'Auto Evolve', icon: Sparkles, gradient: true, always: true },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const { user, displayName, handle, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="sticky top-0 h-dvh flex flex-col overflow-y-auto scrollbar-none">
      {/* Logo */}
      <div className="p-3 xl:p-3">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-accent/30 transition-colors">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          <span className="hidden xl:block font-bold text-xl">Daily AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-1 xl:px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 xl:px-4 rounded-full transition-colors group',
                active
                  ? 'font-bold text-foreground'
                  : 'font-normal text-muted-foreground hover:text-foreground hover:bg-accent/20'
              )}
            >
              <span className="relative shrink-0">
                <Icon className={cn('h-6 w-6', active && 'scale-105')} />
              </span>
              <span className="hidden xl:block text-xl leading-6">{item.label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-border/40 mx-3" />

        {/* Settings + Auto-Tune — ALWAYS VISIBLE */}
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const isDeepMind = item.href === '/ia-auto-news';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 xl:px-4 rounded-full transition-colors group',
                item.gradient
                  ? isDeepMind
                    ? 'text-pink-400 hover:text-pink-300 hover:bg-pink-500/10'
                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                  : active
                    ? 'font-bold text-foreground'
                    : 'font-normal text-muted-foreground hover:text-foreground hover:bg-accent/20'
              )}
            >
              <Icon className={cn('h-6 w-6 shrink-0', item.gradient && (isDeepMind ? 'text-pink-400' : 'text-blue-400'))} />
              <span className="hidden xl:block text-xl leading-6">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile bottom */}
      <div className="relative px-1 xl:px-2 pb-3 mt-auto">
        <button
          className="flex items-center gap-3 w-full p-3 rounded-full hover:bg-accent/20 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
            {user ? (
              <span className="text-sm font-bold text-foreground">
                {(displayName || '?')[0].toUpperCase()}
              </span>
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="hidden xl:block text-left flex-1 min-w-0">
            <p className="text-sm font-bold truncate">
              {loading ? '...' : user ? (displayName || 'User') : 'Guest'}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {loading ? '' : user ? (handle || '') : 'Sign in to save'}
            </p>
          </div>
          <MoreHorizontal className="hidden xl:block h-5 w-5 text-muted-foreground shrink-0" />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full left-2 right-2 mb-2 z-50 bg-card border border-border/40 rounded-xl shadow-xl overflow-hidden">
              {user ? (
                <>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/20 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-accent/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/20 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/20 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
