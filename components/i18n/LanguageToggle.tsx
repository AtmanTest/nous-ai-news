'use client';

import { useLocale } from 'next-intl';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

type SupportedLocale = 'en' | 'fr';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'Français',
};

export function getNextLocale(locale: string): SupportedLocale {
  return locale === 'fr' ? 'en' : 'fr';
}

export function persistLocale(locale: SupportedLocale) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 30}; sameSite=lax`;
}

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const nextLocale = getNextLocale(locale);

  const switchLocale = () => {
    persistLocale(nextLocale);
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground',
        className
      )}
      aria-label={`Switch language to ${LOCALE_LABELS[nextLocale]}`}
      title={`Switch language to ${LOCALE_LABELS[nextLocale]}`}
    >
      <Languages className="h-5 w-5" aria-hidden="true" />
      <span className="text-xs uppercase tracking-wide">{nextLocale.toUpperCase()}</span>
    </button>
  );
}
