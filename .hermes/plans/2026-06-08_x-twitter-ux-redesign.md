# X/Twitter-Style UX Redesign — Implementation Plan (Complete)

> **Framework:** Next.js 14.2.35 App Router + TypeScript 5.9 + Tailwind CSS 3.4 + React 18.3
> **Goal:** Refonte complète en layout 3 colonnes type X (Twitter) — dark theme pur, sidebar gauche navigation, feed central scrollable infini, panneau droit widgets.
> **Constraint:** Settings et Auto-Tune TOUJOURS accessibles depuis sidebar + mobile bottom nav.
> **Backup:** `/tmp/nous-ai-news-BACKUP/` (full copy) + Git commit `be23311`

---

## ⚠️ CORRECTION CRITIQUE — RÈGLE DE LAYOUT UNIVERSELLE

**TOUTES les pages utilisent le layout 3 colonnes avec sidebar. Aucune exception.**

- `AppLayout` est appliqué dans **`app/layout.tsx`** racine — la sidebar est TOUJOURS montée
- Chaque page exporte **uniquement son contenu de colonne centrale**
- Le Right Panel peut être masqué conditionnellement (ex: article page), **jamais la sidebar**

### Adaptation des pages dans la colonne centrale :

| Page | Comportement dans la colonne centrale |
|---|---|
| `/` | Feed Home (For You / LLM / IoT tabs) |
| `/article/[slug]` | Contenu article full width + back button |
| `/settings` | Sous-nav interne + contenu settings |
| `/auto-tune` | Timeline Auto-Tune (style X posts) |
| `/profile` | Profil + articles de l'utilisateur |
| `/trending` | Trending feed |
| `/search` | Search + results |
| `/bookmarks` | Bookmarks list |
| `/topics/[slug]` | Topic feed |

### Root layout pattern :

```tsx
// app/layout.tsx — AppLayout wrappé GLOBALEMENT
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>
          <AppLayout>
            {children}  {/* contenu de la colonne centrale uniquement */}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### AppLayout — sidebar toujours montée :

```tsx
const AppLayout = ({ children }) => (
  <div className="flex justify-center min-h-screen bg-background">
    <div className="flex w-full max-w-[1265px]">
      <LeftSidebar />                    {/* TOUJOURS monté */}
      <main className="flex-1 min-w-0 border-x border-border/40">
        <Header />                       {/* mobile only */}
        {children}
      </main>
      <RightPanel />                     {/* masqué sur tablet/mobile */}
    </div>
  </div>
);
```

### INTERDIT :

```tsx
// ❌ JAMAIS — page standalone sans AppLayout
export default function ArticlePage() {
  return <div className="standalone">...</div>;
}

// ✅ TOUJOURS — juste le contenu de la colonne centrale
export default function ArticlePage() {
  return <article>...</article>;
}
```

---

## Phase 1 — Design Tokens & Global CSS

### Task 1: Réécrire globals.css avec les tokens X

**Files:**
- Modify: `app/globals.css`

**Nouveau système de couleurs dark/light pur X:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode — X light theme */
    --background: 0 0% 100%;
    --foreground: 200 10% 8%;          /* #0f1419 */
    --card: 0 0% 97%;                   /* #f7f9f9 */
    --card-foreground: 200 10% 8%;
    --primary: 203 92% 53%;             /* #1d9bf0 exact X blue */
    --primary-foreground: 0 0% 100%;
    --secondary: 200 10% 94%;           /* #eff3f4 */
    --secondary-foreground: 200 10% 8%;
    --muted: 200 5% 94%;
    --muted-foreground: 200 3% 40%;     /* #536471 */
    --accent: 200 10% 94%;
    --accent-foreground: 200 10% 8%;
    --destructive: 0 100% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 200 10% 94%;              /* #eff3f4 */
    --input: 200 10% 94%;
    --ring: 203 92% 53%;
    --radius: 0.625rem;

    /* X-specific tokens via CSS custom props */
    --color-surface: #f7f9f9;
    --color-surface-2: #eff3f4;
    --color-surface-offset: #e7e9ea;
    --color-divider: #eff3f4;
    --color-like: #f91880;
    --color-repost: #00ba7c;
    --color-text-muted: #536471;
  }

  .dark {
    --background: 0 0% 0%;              /* #000 — pure black comme X */
    --foreground: 200 10% 91%;          /* #e7e9ea */
    --card: 0 0% 4%;                    /* #0a0a0a */
    --card-foreground: 200 10% 91%;
    --primary: 203 92% 57%;             /* #1d9bf0 exact */
    --primary-foreground: 0 0% 100%;
    --secondary: 200 6% 9%;             /* #16181c */
    --secondary-foreground: 200 10% 91%;
    --muted: 200 6% 9%;
    --muted-foreground: 200 3% 44%;     /* #71767b */
    --accent: 200 6% 12%;
    --accent-foreground: 200 10% 91%;
    --destructive: 0 100% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 200 3% 18%;               /* #2f3336 */
    --input: 200 3% 18%;
    --ring: 203 92% 57%;

    /* X tokens dark */
    --color-surface: #16181c;
    --color-surface-2: #1e2128;
    --color-surface-offset: #272b30;
    --color-divider: #2f3336;
    --color-like: #f91880;
    --color-repost: #00ba7c;
    --color-text-muted: #71767b;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.5;
  }
}
```

**Key changes:**
- Pure black `#000` background in dark mode (X exact)
- X blue `#1d9bf0` as primary
- Surface colors matching X's card/bg layers
- Border color `#2f3336` (dark) / `#eff3f4` (light)
- Muted text `#71767b` / `#536471`

**Verification:** Run `npm run tnr` + `npx next build --no-lint`

---

## Phase 2 — AppLayout 3 colonnes

### Task 2: Créer le composant AppLayout (grid 3 colonnes)

**Files:**
- Create: `components/layout/AppLayout.tsx`
- Create: `components/layout/AppLayout.module.css` (optionnel, on peut tout faire en Tailwind)

```tsx
// components/layout/AppLayout.tsx
'use client';

import { ReactNode } from 'react';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  trending?: { title: string; id: string; score?: number; source_name?: string }[];
  topics?: string[];
  hideSidebar?: boolean;
  hideRightPanel?: boolean;
  rightPanelContent?: ReactNode;
}

export function AppLayout({
  children,
  trending = [],
  topics = [],
  hideSidebar = false,
  hideRightPanel = false,
  rightPanelContent,
}: AppLayoutProps) {
  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="flex w-full max-w-[1265px]">
        {/* Left Sidebar */}
        {!hideSidebar && (
          <div className="w-[68px] xl:w-[275px] shrink-0 border-r border-border/40">
            <LeftSidebar />
          </div>
        )}

        {/* Main Feed */}
        <main className={cn(
          "flex-1 min-w-0",
          !hideSidebar && "border-r border-border/40",
        )}>
          {children}
        </main>

        {/* Right Panel */}
        {!hideRightPanel && (
          <div className="hidden xl:block w-[350px] shrink-0">
            <RightPanel
              trending={trending}
              topics={topics}
              customContent={rightPanelContent}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Grid layout exact X:**
- Desktop (>1280px): 275px | minmax(0, 600px) | 350px
- Tablet (768-1280px): 68px (icons only) | flex-1 | hidden
- Mobile (<768px): hidden (bottom nav instead) | full width | hidden

---

## Phase 3 — Left Sidebar

### Task 3: Créer le LeftSidebar (nav type X)

**Files:**
- Create: `components/layout/LeftSidebar.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Bell, Bookmark, TrendingUp, 
  Cpu, Radio, Settings, Sparkles, User,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Explore', icon: Search },
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/topics/models', label: 'AI Models', icon: Cpu },
  { href: '/topics/hardware', label: 'IoT & Devices', icon: Radio },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings, always: true },
  { href: '/auto-tune', label: 'Auto-Tune', icon: Sparkles, gradient: true, always: true },
];

export function LeftSidebar() {
  const pathname = usePathname();

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
                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center animate-pulse-soft">
                    3
                  </span>
                )}
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
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 xl:px-4 rounded-full transition-colors group',
                item.gradient
                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                  : active
                    ? 'font-bold text-foreground'
                    : 'font-normal text-muted-foreground hover:text-foreground hover:bg-accent/20'
              )}
            >
              <Icon className={cn('h-6 w-6 shrink-0', item.gradient && 'text-blue-400')} />
              <span className="hidden xl:block text-xl leading-6">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* CTA Button (xl only) */}
      <div className="hidden xl:block px-2 mt-2">
        <button className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-[17px] hover:bg-primary/90 transition-colors shadow-sm">
          Share
        </button>
      </div>

      {/* User profile bottom */}
      <div className="px-1 xl:px-2 pb-3 mt-auto">
        <button className="flex items-center gap-3 w-full p-3 rounded-full hover:bg-accent/20 transition-colors">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="hidden xl:block text-left flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Tazou</p>
            <p className="text-sm text-muted-foreground truncate">@tazoupaparwrml</p>
          </div>
          <MoreHorizontal className="hidden xl:block h-5 w-5 text-muted-foreground shrink-0" />
        </button>
      </div>
    </aside>
  );
}
```

**Key:** Settings et Auto-Tune sont DANS la nav (pas dans un dropdown), séparés par un divider, toujours visibles. Sur mobile (< 768px), la sidebar disparaît et le BottomNav prend le relais.

---

## Phase 4 — Right Panel

### Task 4: Créer le RightPanel (widgets sticky)

**Files:**
- Create: `components/layout/RightPanel.tsx`

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Hash, Radio, Cpu, Sparkles, ExternalLink, Search as SearchIcon } from 'lucide-react';

interface RightPanelProps {
  trending?: { title: string; id: string; score?: number; source_name?: string; trend_count?: number }[];
  topics?: string[];
  customContent?: React.ReactNode;
}

export function RightPanel({ trending = [], topics = [], customContent }: RightPanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <aside className="sticky top-0 h-dvh overflow-y-auto scrollbar-none py-1 pr-2 pl-4 space-y-4">
      {/* Search bar — sticky top */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI News"
            className="w-full h-[42px] pl-11 pr-4 rounded-full border border-transparent bg-secondary text-[15px] placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:bg-background transition-all"
          />
        </form>
      </div>

      {/* Trending Widget */}
      {trending.length > 0 && (
        <WidgetCard title="Trending AI Topics">
          {trending.slice(0, 5).map((item, i) => (
            <Link
              key={item.id}
              href={`/article/${item.id}`}
              className="flex flex-col gap-0.5 px-3 py-3 rounded-lg hover:bg-accent/20 transition-colors cursor-pointer group"
            >
              <span className="text-[13px] text-muted-foreground">
                {String(i + 1).padStart(2, '0')} · Trending
              </span>
              <span className="text-[15px] font-bold group-hover:underline leading-snug">
                {item.title}
              </span>
              {item.score && (
                <span className="text-[13px] text-muted-foreground">
                  {item.source_name} · {Math.round(item.score * 100)} posts
                </span>
              )}
            </Link>
          ))}
          <Link href="/trending" className="block px-3 py-3 text-[15px] text-primary hover:bg-accent/20 rounded-lg transition-colors">
            Show more
          </Link>
        </WidgetCard>
      )}

      {/* Latest Models Widget */}
      <WidgetCard title="Latest Models">
        <ModelRow name="Claude 4.5" provider="Anthropic" time="Released 3h ago" />
        <ModelRow name="Qwen3-72B" provider="Alibaba" time="Trending · 2.1K" />
        <ModelRow name="Gemma 4 OptiQ" provider="Google" time="Updated 6h ago" />
        <Link href="/topics/models" className="block px-3 py-3 text-[15px] text-primary hover:bg-accent/20 rounded-lg transition-colors">
          View all models
        </Link>
      </WidgetCard>

      {/* Auto-Tune Status Widget */}
      <WidgetCard title="AI Auto-Tune Status">
        <div className="px-3 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[15px] font-medium">Bot actif · v2.14.3</span>
          </div>
          <p className="text-[13px] text-muted-foreground">Dernier run : il y a 2h</p>
          <p className="text-[13px] text-muted-foreground">3 bugs corrigés · 2 tests ajoutés</p>
          <Link href="/auto-tune" className="inline-flex items-center gap-1 text-[15px] text-primary hover:underline mt-1">
            Voir Auto-Tune <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </WidgetCard>

      {/* Custom content slot */}
      {customContent}
    </aside>
  );
}

function WidgetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-secondary/80 border border-border/40 overflow-hidden">
      <h3 className="text-xl font-extrabold px-4 pt-4 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function ModelRow({ name, provider, time }: { name: string; provider: string; time: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/20 rounded-lg transition-colors cursor-pointer group">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Cpu className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold group-hover:underline truncate">{name}</p>
        <p className="text-[13px] text-muted-foreground">{provider} · {time}</p>
      </div>
    </div>
  );
}
```

---

## Phase 5 — Feed Components

### Task 5: Créer le FeedHeader (sticky + tabs)

**Files:**
- Create: `components/feed/FeedHeader.tsx`

```tsx
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

export function FeedHeader({ title, tabs, activeTab, onTabChange, showBack, showSettings }: FeedHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/65 backdrop-blur-xl border-b border-border/40">
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
```

---

### Task 6: Créer le NewsCard (carte article style X)

**Files:**
- Create: `components/feed/NewsCard.tsx`
- Create: `components/feed/ActionBar.tsx`
- Create: `components/feed/SkeletonCard.tsx`

**NewsCard:**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Repeat2, Heart, BarChart3, Bookmark, Share, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import { TagChip } from '@/components/ui/TagChip';
import { SourceAvatar } from '@/components/ui/SourceAvatar';
import { ShareButtons } from '@/components/sharing/ShareButtons';

interface NewsCardProps {
  id: string;
  slug?: string;
  title: string;
  summary?: string | null;
  image_url?: string | null;
  source_name?: string;
  source_logo?: string;
  source_handle?: string;
  category?: string | null;
  tags?: string[];
  published_at?: string;
  score?: number;
  is_breaking?: boolean;
  onSourceHide?: (source: string) => void;
}

export function NewsCard({
  id, slug, title, summary, image_url,
  source_name, source_logo, source_handle, category,
  tags, published_at, score, is_breaking,
  onSourceHide,
}: NewsCardProps) {
  const href = `/article/${slug || id}`;
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(score ? Math.round(score * 100) : 0);
  const [showShare, setShowShare] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikes(l => liked ? l - 1 : l + 1);
  };

  return (
    <Link href={href} className="block group">
      <article className="px-4 py-3 border-b border-border/40 hover:bg-accent/[0.03] transition-colors cursor-pointer">
        {/* Header — Source info */}
        <div className="flex items-start gap-3 mb-1">
          <SourceAvatar src={source_logo} name={source_name} size="md" />
          <div className="flex-1 min-w-0 flex items-center gap-1 text-[15px]">
            <span className="font-bold truncate hover:underline">{source_name}</span>
            {source_handle && (
              <span className="text-muted-foreground truncate">@{source_handle}</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground whitespace-nowrap">
              {published_at ? timeAgo(published_at) : ''}
            </span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Body — Title + Summary */}
        <div className="pl-[52px]">
          <h3 className="text-[15px] font-bold leading-snug mb-0.5 line-clamp-2">
            {title}
          </h3>
          {summary && (
            <p className="text-[15px] text-muted-foreground leading-5 line-clamp-3 mb-3">
              {summary}
            </p>
          )}
        </div>

        {/* Image */}
        {image_url && (
          <div className="ml-[52px] mb-3 rounded-2xl overflow-hidden border border-border/40">
            <img
              src={image_url}
              alt={title}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-[52px] mb-2">
            {tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="ml-[52px] max-w-[425px]">
          <div className="flex items-center justify-between -ml-2">
            {/* Comment */}
            <ActionBtn icon={<MessageCircle className="h-4 w-4" />} count={Math.round((score || 10) * 0.3)} />
            {/* Repost */}
            <ActionBtn icon={<Repeat2 className="h-4 w-4" />} count={Math.round((score || 10) * 0.5)} />
            {/* Like */}
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-[13px] rounded-full px-2 py-1 transition-all',
                liked
                  ? 'text-[#f91880] bg-[rgba(249,24,128,0.1)]'
                  : 'text-muted-foreground hover:text-[#f91880] hover:bg-[rgba(249,24,128,0.1)]'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current scale-110')} />
              <span>{likes > 999 ? `${(likes / 1000).toFixed(1)}K` : likes}</span>
            </button>
            {/* Views */}
            <ActionBtn icon={<BarChart3 className="h-4 w-4" />} count={(score || 10) * 50 > 999 ? `${((score || 10) * 50 / 1000).toFixed(1)}K` : (score || 10) * 50} />
            {/* Bookmark */}
            <ActionBtn icon={<Bookmark className="h-4 w-4" />} />
            {/* Share */}
            <div className="relative">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShare(!showShare); }}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-2 py-1 transition-all"
              >
                <Share className="h-4 w-4" />
              </button>
              {showShare && (
                <div className="absolute bottom-full left-0 mb-2 z-50" onClick={(e) => e.stopPropagation()}>
                  <ShareButtons title={title} path={href} />
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function ActionBtn({ icon, count }: { icon: React.ReactNode; count?: number | string }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-2 py-1 transition-all"
    >
      {icon}
      {count !== undefined && <span>{count}</span>}
    </button>
  );
}
```

**SkeletonCard for loading state:**

```tsx
// components/feed/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="px-4 py-3 border-b border-border/40 animate-pulse">
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
        <div className="h-4 w-5/6 bg-accent rounded mb-3" />
        <div className="aspect-[16/9] bg-accent rounded-2xl mb-2" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 bg-accent rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6 — Article Drawer (Slide-in modal type X)

### Task 7: Créer ArticleDrawer — slide-in depuis la droite

**Files:**
- Create: `components/drawers/ArticleDrawer.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Heart, Bookmark, Share2, MessageCircle, Repeat2, Clock, User } from 'lucide-react';
import { timeAgo, readingTime } from '@/lib/utils';
import { SourceAvatar } from '@/components/ui/SourceAvatar';
import { ShareButtons } from '@/components/sharing/ShareButtons';
import { TagChip } from '@/components/ui/TagChip';

interface ArticleDrawerProps {
  article: {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    image_url?: string | null;
    source_name?: string;
    source_logo?: string;
    category?: string | null;
    tags?: string[];
    published_at?: string;
    url?: string;
  };
  onClose: () => void;
}

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  const [liked, setLiked] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 z-[1000] w-full sm:w-[600px] h-dvh bg-background border-l border-border/40 overflow-y-auto shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center gap-4 px-4 h-[53px]">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-accent/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="font-bold text-[15px]">Article</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Hero image */}
          {article.image_url && (
            <div className="rounded-2xl overflow-hidden border border-border/40 mb-6">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full aspect-[16/9] object-cover"
              />
            </div>
          )}

          {/* Source + meta */}
          <div className="flex items-center gap-3 mb-4">
            <SourceAvatar src={article.source_logo} name={article.source_name} size="lg" />
            <div>
              <p className="font-bold text-[15px]">{article.source_name}</p>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span>{article.published_at ? timeAgo(article.published_at) : ''}</span>
                <span>·</span>
                <span>{readingTime(article.content || article.summary || article.title)} min read</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-extrabold leading-tight mb-4">
            {article.title}
          </h1>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>
          )}

          {/* Summary (if no content) */}
          {!article.content && article.summary && (
            <p className="text-[17px] text-muted-foreground leading-7 mb-6">
              {article.summary}
            </p>
          )}

          {/* Full content */}
          {article.content && (
            <div className="text-[17px] leading-7 space-y-4 mb-8 prose prose-invert max-w-none">
              {article.content.split('\n').map((para, i) => (
                para.trim() ? <p key={i}>{para}</p> : null
              ))}
            </div>
          )}

          {/* Source link */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-border/50 text-[17px] font-bold hover:bg-accent/20 transition-colors mb-6"
            >
              Read original article <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/40 px-4 py-3">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
              <MessageCircle className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-[#00ba7c] transition-colors p-2 rounded-full hover:bg-[rgba(0,186,124,0.1)]">
              <Repeat2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 p-2 rounded-full transition-all ${
                liked ? 'text-[#f91880] bg-[rgba(249,24,128,0.1)]' : 'text-muted-foreground hover:text-[#f91880] hover:bg-[rgba(249,24,128,0.1)]'
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current scale-110' : ''}`} />
            </button>
            <ShareButtons title={article.title} path={`/article/${article.id}`} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
```

---

## Phase 7 — UI Primitives

### Task 8: Créer les composants UI atomiques

**Files:**
- Create: `components/ui/TagChip.tsx`
- Create: `components/ui/SourceAvatar.tsx`
- Create: `components/ui/ThemeToggle.tsx`
- Create: `components/ui/NotifBadge.tsx`

```tsx
// TagChip.tsx
export function TagChip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-[13px] font-medium hover:bg-primary/20 transition-colors cursor-pointer"
    >
      {label}
    </span>
  );
}
```

```tsx
// SourceAvatar.tsx
import { cn } from '@/lib/utils';

interface SourceAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SourceAvatar({ src, name, size = 'md' }: SourceAvatarProps) {
  const sizeClass = { sm: 'w-6 h-6 text-[10px]', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AI';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Source'}
        className={cn('rounded-full object-cover shrink-0', sizeClass[size])}
      />
    );
  }

  return (
    <div className={cn('rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0', sizeClass[size])}>
      {initials}
    </div>
  );
}
```

---

## Phase 8 — App Layout Integration

### Task 9: Mettre à jour le layout racine + simplifier Header

**Files:**
- Modify: `app/layout.tsx` — wrap content with AppLayout
- Modify: `components/layout/Header.tsx` — simplify (remove desktop nav, keep mobile logo + actions)
- Modify: `components/layout/BottomNav.tsx` — add Settings + Auto-Tune

**Root layout change:**
The root layout should NOT wrap everything in AppLayout since some pages (article, auth) need different layouts. Instead, each page applies AppLayout individually.

**Simplified Header (only visible on mobile):**

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function Header() {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl md:hidden">
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
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-accent/30 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
```

**Updated BottomNav:**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Search, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/auto-tune', label: 'Auto-Tune', icon: Sparkles, gradient: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[48px] px-2 py-1.5 rounded-lg transition-colors',
                isActive
                  ? item.gradient ? 'text-blue-400' : 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-all', isActive && 'scale-110')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

## Phase 9 — Contexts & Data Flow

### Task 10: Créer le NewsContext (state management feed)

**Files:**
- Create: `contexts/NewsContext.tsx`

```tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  source_logo?: string;
  source_handle?: string;
  category: string | null;
  tags: string[];
  published_at: string;
  score: number;
  is_breaking: boolean;
}

interface NewsContextType {
  articles: Article[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NewsContext = createContext<NewsContextType | null>(null);

const PAGE_SIZE = 20;

export function NewsProvider({ children, initialArticles = [] }: { children: ReactNode; initialArticles?: Article[] }) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('for-you');
  const cursorRef = useRef<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tab: activeTab,
        limit: String(PAGE_SIZE),
      });
      if (cursorRef.current) params.set('cursor', cursorRef.current);

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setArticles(prev => [...prev, ...data.articles]);
      cursorRef.current = data.next_cursor || null;
      setHasMore(data.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, activeTab]);

  const refresh = useCallback(async () => {
    cursorRef.current = null;
    setArticles([]);
    setHasMore(true);
    await loadMore();
  }, [loadMore]);

  return (
    <NewsContext.Provider value={{ articles, isLoading, hasMore, error, activeTab, setActiveTab, loadMore, refresh }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error('useNews must be used within NewsProvider');
  return ctx;
}
```

---

## Phase 10 — App Integration (Global Layout)

### Task 11: AppLayout dans root layout.tsx — global, pas per-page

**Files to modify:**
- `app/layout.tsx` — wrap children in `<AppLayout>`
- Remove `hideSidebar`/`hideRightPanel` props from AppLayout (sidebar ALWAYS visible)
- All existing pages: just render their content (central column only)

**Root layout — AppLayout GLOBAL :**

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="nous-news-theme">
          <AppLayout>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Right Panel — conditional hide based on route :**

```tsx
// components/layout/RightPanel.tsx
const RightPanel = () => {
  const pathname = usePathname();
  const hideRightPanel = pathname.startsWith('/article/');

  if (hideRightPanel) return null;  // right panel only, sidebar never hidden

  return <aside className="...">...</aside>;
};
```

**Every page — just renders central column content :**

```tsx
// app/page.tsx — no AppLayout wrapper
export default async function HomePage() {
  const { featured, trending, latest } = await getArticles();
  const TOPICS = ['models', 'research', 'business', 'policy', 'open-source', 'startups'];

  return (
    <>
      <FeedHeader title="Home" tabs={[
        { label: 'For You', value: 'for-you' },
        { label: 'Following', value: 'following' },
        { label: 'LLM', value: 'llm' },
        { label: 'IoT', value: 'iot' },
      ]} />

      <LiveUpdateBar initialTimestamp={latest[0]?.published_at || new Date().toISOString()} />
      <NewPostsBanner count={0} onRefresh={() => {}} />

      <NewsProvider initialArticles={[]}>
        <InfiniteFeed articles={latest} />
      </NewsProvider>
    </>
  );
}

// app/article/[slug]/page.tsx — no AppLayout wrapper
export default async function ArticlePage({ params }) {
  const article = await getArticle(params.slug);
  return (
    <article className="article-full-content">
      <button className="back-btn" onClick={() => router.back()}>← Back</button>
      <img src={article.image_url} className="article-hero" />
      <h1 className="text-[23px] font-extrabold">{article.title}</h1>
      ...
    </article>
  );
}

---

## Phase 11 — Auto-Tune Page (Style X)

### Task 12: Restyler /auto-tune en timeline X

Modify `app/auto-tune/page.tsx` to render as X-style timeline in the central column — NewsCard-style entries showing changelog commits with action bar.

Right Panel adapté automatiquement : widget "AI Auto-Tune Status" étendu avec détails du dernier run (par RightPanel).

---

## Phase 12 — Settings Page (Style X)

### Task 13: Restyler /settings en layout 2 colonnes type X

Settings sidebar gauche (navigation sections) + contenu droit.

---

## Rollback Plan

```bash
# Vercel: revert to previous deployment
npx vercel rollback --token ***REDACTED***

# Git: revert last commit
git revert HEAD

# Files: restore from backup
cp -R /tmp/nous-ai-news-BACKUP/ /tmp/nous-ai-news/
```
