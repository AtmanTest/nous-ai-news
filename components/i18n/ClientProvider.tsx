'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useParams } from 'next/navigation';
import { routing } from '@/i18n/routing';

interface I18nClientProviderProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

export function I18nClientProvider({
  children,
  locale,
  messages,
}: I18nClientProviderProps) {
  // Validate locale
  const validLocale = routing.locales.includes(locale as any) ? locale : routing.defaultLocale;

  return (
    <NextIntlClientProvider locale={validLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}