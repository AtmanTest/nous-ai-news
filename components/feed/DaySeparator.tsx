'use client';

import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface DaySeparatorProps {
  label: string;
  count: number;
  className?: string;
}

export function DaySeparator({ label, count, className }: DaySeparatorProps) {
  const t = useTranslations('feed.dayFilter');

  const articlesLabel = t('articlesCount', { count });

  return (
    <div
      className={cn(
        'sticky top-0 z-10 w-full',
        'bg-background/80 backdrop-blur-sm py-2',
        'border-t border-neutral-800',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 px-4 max-w-3xl mx-auto">
        <div className="h-px flex-1 bg-neutral-800" />
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{label}</span>
          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
            {articlesLabel}
          </span>
        </div>
        <div className="h-px flex-1 bg-neutral-800" />
      </div>
    </div>
  );
}