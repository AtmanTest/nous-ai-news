import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getNextLocale, persistLocale, LanguageToggle } from '@/components/i18n/LanguageToggle';

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/feed',
}));

describe('LanguageToggle', () => {
  it('toggles between French and English only', () => {
    expect(getNextLocale('fr')).toBe('en');
    expect(getNextLocale('en')).toBe('fr');
    expect(getNextLocale('de')).toBe('fr');
  });

  it('persists the selected locale in the NEXT_LOCALE cookie', () => {
    persistLocale('en');
    expect(document.cookie).toContain('NEXT_LOCALE=en');
  });

  it('renders the opposite locale as the switch action', () => {
    render(<LanguageToggle />);

    expect(screen.getByRole('button', { name: /switch language to english/i })).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /switch language to english/i });
    btn.click();

    expect(document.cookie).toContain('NEXT_LOCALE=en');
  });
});
