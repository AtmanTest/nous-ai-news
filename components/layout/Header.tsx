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
          ✦ Thinked by Jahangir Thasin, Made with ❤️ with AI — LinkedIn
        </Link>
      </div>
    </header>
  );
}
