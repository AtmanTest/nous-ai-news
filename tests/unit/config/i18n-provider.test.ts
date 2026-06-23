import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('I18n provider production configuration', () => {
  it('pins a timeZone to avoid next-intl ENVIRONMENT_FALLBACK warnings in production SSR', () => {
    const source = readFileSync(join(process.cwd(), 'components/i18n/ClientProvider.tsx'), 'utf8');

    expect(source).toContain('NextIntlClientProvider');
    expect(source).toMatch(/timeZone=["']UTC["']/);
  });
});
