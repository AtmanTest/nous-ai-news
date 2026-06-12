import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const APP_DIR = path.resolve(__dirname, '../../../app');

/**
 * Resolve the actual page/route file path for a given Next.js App Router route.
 */
function routeFile(route: string): string {
  const segments = route.replace(/^\//, '').split('/').filter(Boolean);

  if (segments.length === 0) {
    // Root route
    const files = ['page.tsx', 'page.ts', 'page.js'];
    for (const f of files) {
      const p = path.join(APP_DIR, f);
      if (fs.existsSync(p)) return path.relative(APP_DIR, p);
    }
    return 'page.tsx';
  }

  // Check for file-based routes like feed.xml/route.ts, sitemap.ts, robots.ts
  const last = segments[segments.length - 1];
  if (last.includes('.')) {
    const dirPath = path.join(APP_DIR, ...segments);
    if (fs.existsSync(dirPath)) {
      if (fs.existsSync(path.join(dirPath, 'route.ts'))) return path.join(...segments, 'route.ts');
      if (fs.existsSync(path.join(dirPath, 'route.js'))) return path.join(...segments, 'route.js');
    }
    const fileBase = last.split('.')[0];
    const candidates = [`${fileBase}.ts`, `${fileBase}.tsx`, `${fileBase}.js`];
    for (const file of candidates) {
      const filePath = path.join(APP_DIR, file);
      if (fs.existsSync(filePath)) return file;
    }
    return path.join(...segments, 'route.ts');
  }

  const pageDir = path.join(APP_DIR, ...segments);
  if (fs.existsSync(pageDir)) {
    const candidates = ['page.tsx', 'page.ts', 'page.js'];
    for (const f of candidates) {
      if (fs.existsSync(path.join(pageDir, f))) return path.join(...segments, f);
    }
  }

  // Try route groups
  const appItems = fs.readdirSync(APP_DIR, { withFileTypes: true });
  for (const item of appItems) {
    if (item.isDirectory() && item.name.startsWith('(') && item.name.endsWith(')')) {
      const groupDir = path.join(APP_DIR, item.name, ...segments);
      if (fs.existsSync(groupDir)) {
        const candidates = ['page.tsx', 'page.ts', 'page.js'];
        for (const f of candidates) {
          if (fs.existsSync(path.join(groupDir, f))) return path.join(item.name, ...segments, f);
        }
      }
    }
  }

  return path.join(...segments, 'page.tsx');
}

describe('Feed page and API routes', () => {
  it('/feed page exists', () => {
    const relPath = routeFile('/feed');
    const absPath = path.join(APP_DIR, relPath);
    expect(fs.existsSync(absPath)).toBe(true);
  });

  it('feed page is a Next.js page', () => {
    const relPath = routeFile('/feed');
    const absPath = path.join(APP_DIR, relPath);
    const content = fs.readFileSync(absPath, 'utf-8');
    expect(content).toContain('TabbedNewsFeed');
  });

  it('/api/news route supports tab parameter', () => {
    const apiPath = path.join(APP_DIR, 'api/news/route.ts');
    expect(fs.existsSync(apiPath)).toBe(true);
    const content = fs.readFileSync(apiPath, 'utf-8');
    expect(content).toContain('tab');
  });

  it('/api/news route handles trending tab', () => {
    const apiPath = path.join(APP_DIR, 'api/news/route.ts');
    const content = fs.readFileSync(apiPath, 'utf-8');
    expect(content).toContain("tab === 'trending'");
  });

  it('/api/news route correctly parses tab query param', () => {
    const apiPath = path.join(APP_DIR, 'api/news/route.ts');
    const content = fs.readFileSync(apiPath, 'utf-8');
    // The route should validate query params with Zod schema
    expect(content).toMatch(/NewsQuerySchema/);
    expect(content).toMatch(/safeParse/);
  });

  it('/api/news route defaults to "latest" when no tab provided', () => {
    const apiPath = path.join(APP_DIR, 'api/news/route.ts');
    const content = fs.readFileSync(apiPath, 'utf-8');
    expect(content).toMatch(/default\(['\"]latest['\"]\)/);
  });
});

describe('useFeed hook', () => {
  it('useFeed hook file exists', () => {
    const hookPath = path.resolve(__dirname, '../../../hooks/useFeed.ts');
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it('useFeed has Article interface', () => {
    const hookPath = path.resolve(__dirname, '../../../hooks/useFeed.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('export interface Article');
  });

  it('useFeed supports all three tabs', () => {
    const hookPath = path.resolve(__dirname, '../../../hooks/useFeed.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain("'latest'");
    expect(content).toContain("'trending'");
    expect(content).toContain("'for-you'");
  });

  it('useFeed uses useSearchParams for URL-controlled tab', () => {
    const hookPath = path.resolve(__dirname, '../../../hooks/useFeed.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('useSearchParams');
    expect(content).toContain('searchParams.get');
  });

  it('useFeed uses useRouter to update URL on tab change', () => {
    const hookPath = path.resolve(__dirname, '../../../hooks/useFeed.ts');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('router.replace');
  });
});

describe('TabbedNewsFeed component', () => {
  it('TabbedNewsFeed exists', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    expect(fs.existsSync(compPath)).toBe(true);
  });

  it('TabbedNewsFeed uses FeedHeader', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('FeedHeader');
  });

  it('TabbedNewsFeed uses useFeed hook', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('useFeed');
  });

  it('TabbedNewsFeed uses NewsCard for rendering articles', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('NewsCard');
  });

  it('TabbedNewsFeed handles loading state', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('isLoading');
    expect(content).toContain('LoadingSkeleton');
  });

  it('TabbedNewsFeed handles error state', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('error');
    expect(content).toContain('FeedError');
  });

  it('TabbedNewsFeed handles empty state', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('FeedEmpty');
  });

  it('TabbedNewsFeed uses AuthContext for For You tab', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('useAuth');
  });

  it('TabbedNewsFeed has infinite scroll trigger', () => {
    const compPath = path.resolve(__dirname, '../../../components/feed/TabbedNewsFeed.tsx');
    const content = fs.readFileSync(compPath, 'utf-8');
    expect(content).toContain('loadMore');
    expect(content).toContain('loadMore');
  });
});
