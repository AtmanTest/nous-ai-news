import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('FR/EN locale configuration', () => {
  it('only advertises locales that have message bundles', () => {
    const routingSource = readFileSync(join(process.cwd(), 'i18n/routing.ts'), 'utf8');
    const middlewareSource = readFileSync(join(process.cwd(), 'middleware.ts'), 'utf8');
    const messageLocales = readdirSync(join(process.cwd(), 'messages'))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''))
      .sort();

    expect(messageLocales).toEqual(['en', 'fr']);
    expect(routingSource).toContain("locales: ['en', 'fr']");
    expect(middlewareSource).toContain("const locales = ['en', 'fr']");
  });

  it('defaults to English and keeps locale detection enabled', () => {
    const routingSource = readFileSync(join(process.cwd(), 'i18n/routing.ts'), 'utf8');
    const middlewareSource = readFileSync(join(process.cwd(), 'middleware.ts'), 'utf8');

    expect(routingSource).toContain("defaultLocale: 'en'");
    expect(routingSource).toContain('localeDetection: true');
    expect(middlewareSource).toContain("const defaultLocale = 'en'");
  });
});
