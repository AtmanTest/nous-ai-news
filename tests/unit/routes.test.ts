import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const APP_DIR = path.resolve(__dirname, '../../app');

/**
 * Resolve the actual page/route file path for a given Next.js App Router route.
 *
 * Converts route patterns to actual file paths:
 * - /          → page.tsx (in app/)
 * - /search    → search/page.tsx
 * - /feed.xml  → feed.xml/route.ts
 * - /(auth)/login → (auth)/login/page.tsx
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
    return 'page.tsx'; // default expectation
  }

  // Check for file-based routes like feed.xml/route.ts, sitemap.ts, robots.ts
  // These can be either route handlers (route.ts) or metadata files (sitemap.ts, robots.ts)
  const last = segments[segments.length - 1];
  if (last.includes('.')) {
    // e.g. feed.xml → feed.xml/route.ts
    const dirPath = path.join(APP_DIR, ...segments);
    if (fs.existsSync(dirPath)) {
      if (fs.existsSync(path.join(dirPath, 'route.ts'))) return path.join(...segments, 'route.ts');
      if (fs.existsSync(path.join(dirPath, 'route.js'))) return path.join(...segments, 'route.js');
    }
    // Check for top-level metadata files like /app/robots.ts, /app/sitemap.ts
    // e.g. 'robots.txt' → filebase 'robots', look for robots.ts in app/
    const fileBase = last.split('.')[0];
    const candidates = [`${fileBase}.ts`, `${fileBase}.tsx`, `${fileBase}.js`];
    for (const file of candidates) {
      const filePath = path.join(APP_DIR, file);
      if (fs.existsSync(filePath)) return file;
    }
    return path.join(...segments, 'route.ts');
  }

  // Dynamic segments: [slug]
  const pageDir = path.join(APP_DIR, ...segments);
  if (fs.existsSync(pageDir)) {
    const candidates = ['page.tsx', 'page.ts', 'page.js'];
    for (const f of candidates) {
      if (fs.existsSync(path.join(pageDir, f))) return path.join(...segments, f);
    }
  }

  // Try as parenthesized route group
  // Check if the route appears in any route group directory
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

describe('Route Existence', () => {
  const expectedPages: { route: string; label: string }[] = [
    { route: '/', label: 'Home page' },
    { route: '/search', label: 'Search page' },
    { route: '/trending', label: 'Trending page' },
    { route: '/bookmarks', label: 'Bookmarks page' },
    { route: '/profile', label: 'Profile page' },
    { route: '/feed.xml', label: 'RSS feed' },
    { route: '/sitemap.xml', label: 'Sitemap' },
    { route: '/robots.txt', label: 'Robots.txt' },
    { route: '/login', label: 'Login page' },
    { route: '/register', label: 'Register page' },
    { route: '/status/releases', label: 'Releases page' },
    { route: '/status/changelog', label: 'Changelog page' },
  ];

  for (const { route, label } of expectedPages) {
    it(`${label} (${route}) exists`, () => {
      const relPath = routeFile(route);
      const absPath = path.join(APP_DIR, relPath);
      expect(fs.existsSync(absPath)).toBe(true);
    });
  }

  it('discovers all expected app routes from directory structure', () => {
    const discovered: string[] = [];

    function walk(dir: string, prefix: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip route groups with parens—they're just organizational
          if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
            walk(full, prefix);
          } else if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
            walk(full, prefix + '/:' + entry.name.slice(1, -1));
          } else {
            walk(full, prefix + '/' + entry.name);
          }
        } else if (
          (entry.name === 'page.tsx' || entry.name === 'page.ts' || entry.name === 'page.js' || entry.name === 'route.ts' || entry.name === 'route.js') &&
          !full.includes('/api/')
        ) {
          // Parent directory name tells us the route
          const parentDir = path.basename(path.dirname(full));
          if (parentDir === 'app') {
            discovered.push('/');
          } else {
            // Get the route relative to app/
            const relative = path.relative(APP_DIR, path.dirname(full));
            const routeSegments = relative.split('/').filter(s => !s.startsWith('(') || !s.endsWith(')'));
            discovered.push('/' + routeSegments.join('/'));
          }
        }
      }
    }

    walk(APP_DIR, '');

    // Normalize: de-duplicate and sort
    const uniqueRoutes = [...new Set(discovered)].sort();

    // Check that all expected non-dynamic routes are present
    const expectedStatic = ['/', '/search', '/trending', '/bookmarks', '/profile', '/feed.xml', '/status/releases', '/status/changelog'];
    for (const route of expectedStatic) {
      expect(uniqueRoutes).toContain(route);
    }

    // Check dynamic route patterns
    expect(uniqueRoutes.some(r => r.startsWith('/article/'))).toBe(true);
    expect(uniqueRoutes.some(r => r.startsWith('/topics/'))).toBe(true);
  });
});
