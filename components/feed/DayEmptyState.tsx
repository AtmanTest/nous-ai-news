'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface DayEmptyStateProps {
  date: string;
  onGoToPreviousDay: () => void;
  className?: string;
}

export function DayEmptyState({
  date,
  onGoToPreviousDay,
  className,
}: DayEmptyStateProps) {
  const t = useTranslations('feed.dayFilter.emptyState');
  const dateObj = new Date(date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        'bg-neutral-900/30 rounded-2xl border border-neutral-800',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-2xl">
        📭
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{t('title')}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {formattedDate}
      </p>
      <button
        onClick={onGoToPreviousDay}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        aria-label={t('goBack')}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('goBack')}
      </button>
    </div>
  );
}