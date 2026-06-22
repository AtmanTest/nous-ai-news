import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');

function read(relPath: string) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('Supabase production environment wiring', () => {
  it('admin server client falls back to SUPABASE_KEY when SUPABASE_SERVICE_ROLE_KEY is not present', () => {
    const source = read('lib/supabase/server.ts');

    expect(source).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY');
  });

  it('/api/news accepts either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY', () => {
    const source = read('app/api/news/route.ts');

    expect(source).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY');
  });

  it('dashboard feed APIs all accept existing production SUPABASE_KEY fallback', () => {
    const apiRoutes = [
      'app/api/news/counts-by-day/route.ts',
      'app/api/news/models/route.ts',
      'app/api/daily-feed/route.ts',
    ];

    for (const route of apiRoutes) {
      const source = read(route);
      expect(source, route).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL');
      expect(source, route).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY');
    }
  });

  it('Vercel production workflow maps SUPABASE_SERVICE_ROLE_KEY from the existing SUPABASE_KEY secret', () => {
    const workflow = read('.github/workflows/vercel-prod.yml');

    expect(workflow).toContain('SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}');
  });

  it('CI and Vercel deploy pipelines run dashboard smoke tests before/after production deployment', () => {
    const ci = read('.github/workflows/ci.yml');
    const deploy = read('.github/workflows/vercel-prod.yml');

    expect(ci).toContain('npm run test:e2e:smoke');
    expect(deploy).toContain('npm run test:e2e:smoke');
    expect(deploy).toContain('E2E_BASE_URL: https://nous-daily.vercel.app');
  });
});
