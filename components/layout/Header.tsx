'use client';

import Link from 'next/link';
import { Search, Sun, Moon, Sunset, Settings } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const themeCycle: Record<string, 'dark' | 'dim' | 'light'> = {
  dark: 'dim',
  dim: 'light',
  light: 'dark',
};

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl flex flex-col">
      {/* Top row: navigation icons */}
      <div className="flex items-center justify-between h-[53px] px-4 border-b border-border/40">
        <div className="flex items-center gap-1">
          <Link href="/search" className="p-2 rounded-full hover:bg-accent/30 transition-colors">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/settings" className="p-2 rounded-full hover:bg-accent/30 transition-colors">
            <Settings className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setTheme(themeCycle[theme])}
            className="p-2 rounded-full hover:bg-accent/30 transition-colors"
            aria-label={`Switch to ${themeCycle[theme]} theme`}
          >
            {theme === 'dark' && <Sun className="h-5 w-5" />}
            {theme === 'dim' && <Sunset className="h-5 w-5" />}
            {theme === 'light' && <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Bottom row: centered branding badge */}
      <div className="flex justify-center py-2.5 px-4 border-b border-border/40">
        <Link
          href="https://www.linkedin.com/in/thasin-j-47582635/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full border animate-glide-border text-xs font-medium tracking-wide animate-pulse-blue whitespace-nowrap"
        >
          ✦ Thinked by Jahangir Thasin, Made with ❤️ with AI
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </Link>
      </div>
    </header>
  );
}
