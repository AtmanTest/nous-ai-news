'use client';

import Link from 'next/link';
import { Search, Sun, Moon, Sunset, Settings } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useState, useRef, useEffect } from 'react';

const themeCycle: Record<string, 'dark' | 'dim' | 'light'> = {
  dark: 'dim',
  dim: 'light',
  light: 'dark',
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl hidden md:flex">
      <div className="flex items-center justify-between h-[53px] px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
        </Link>
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
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="ml-1 h-8 w-8 rounded-full overflow-hidden transition-colors duration-180"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'currentColor',
              }}
            >
              <img
                src="https://media.licdn.com/dms/image/v2/D4E35AQH48h0Gd3b9sA/profile-framedphoto-shrink_100_100/profile-framedphoto-shrink_100_100/0/1737031316814?e=1740268800&v=beta&t=j07vMPBYORRSidUpnwq3P9bPB9YMYS6E2HMOshspxdM"
                alt="JT"
                className="h-full w-full object-cover"
              />
            </button>
            {menuOpen && (
              <div
                className="absolute right-4 top-[44px] w-[260px] rounded-xl border border-white/10 bg-card shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[1000]"
                style={{ animation: 'opacity 180ms ease, translateY(-4px) 180ms ease' }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'currentColor' }}>
                      <img
                        src="https://media.licdn.com/dms/image/v2/D4E35AQH48h0Gd3b9sA/profile-framedphoto-shrink_100_100/profile-framedphoto-shrink_100_100/0/1737031316814?e=1740268800&v=beta&t=j07vMPBYORRSidUpnwq3P9bPB9YMYS6E2HMOshspxdM"
                        alt="JT"
                        className="h-full w-full object-cover"
                      />
                  </div>
                    <div>
                      <div className="text-sm font-bold">Jahangir Thasin</div>
                      <div className="text-xs text-muted-foreground">Consultant QA Senior · Freelance</div>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                        🟢 Open to missions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/[0.07] mx-4" />
                <div className="p-2">
                  <Link
                    href="https://www.linkedin.com/in/thasin-j-47582635/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-180"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    🔗 LinkedIn Profile
                  </Link>
                </div>
                <div className="border-t border-white/[0.07] mx-4" />
                <div className="p-3 text-center">
                  <span className="text-[11px] italic opacity-40">✦ Conceived by JT · Crafted with AI</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
