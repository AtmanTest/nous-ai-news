import { describe, expect, it } from 'vitest';

interface NextConfigShape {
  poweredByHeader?: boolean;
  headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
}

async function loadConfig(): Promise<NextConfigShape> {
  const url = new URL('../../../next.config.mjs', import.meta.url).href;
  const module = (await import(/* @vite-ignore */ url)) as { default: NextConfigShape };
  return module.default;
}

/** [REQ-PLT-06] Niveau composant : la configuration déclare les en-têtes, sur toutes les routes. */
describe('[REQ-PLT-06] configuration des en-têtes de sécurité', () => {
  it('applique les en-têtes à toutes les routes', async () => {
    const rules = await (await loadConfig()).headers();
    expect(rules).toHaveLength(1);
    expect(rules[0]?.source).toBe('/:path*');
  });

  it('déclare nosniff, X-Frame-Options, Referrer-Policy et Permissions-Policy', async () => {
    const rules = await (await loadConfig()).headers();
    const headers = Object.fromEntries((rules[0]?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]));
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
  });

  it('désactive l’en-tête X-Powered-By', async () => {
    expect((await loadConfig()).poweredByHeader).toBe(false);
  });
});
