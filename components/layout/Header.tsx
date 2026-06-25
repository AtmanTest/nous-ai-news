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
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl flex">
      <div className="flex items-center justify-between h-[53px] px-4">
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
          <span className="hidden lg:inline-flex items-center gap-1 ml-2">
            <Link href="https://www.linkedin.com/in/thasin-j-47582635/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border animate-glide-border text-[10px] font-medium tracking-wide animate-pulse-blue">
              ✦ Thinked by Jahangir Thasin · Made with ❤️ &amp; AI
            </Link>
          </span>
        </div>
      </div>
    </header>
  );
}
