'use client';

import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface DayFilterBarProps {
  selectedDate: string; // ISO date 'YYYY-MM-DD'
  onDateChange: (date: string) => void;
  className?: string;
}

interface DayChipProps {
  date: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function DayChip({ date, label, isActive, onClick }: DayChipProps) {
  const t = useTranslations('feed.dayFilter');

  return (
    <motion.div
      className={cn(
        'relative flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        'transition-colors duration-200',
        'min-w-[72px] touch-target',
        isActive
          ? 'bg-white text-black font-semibold shadow-sm'
          : 'bg-neutral-900 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
      )}
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      aria-label={label}
    >
      <span>{label}</span>
    </motion.div>
  );
}

// Helper to create UTC date at midnight for a given offset from today (UTC)
function getUtcDateString(offsetDays: number): string {
  const now = new Date();
  // Create date at UTC midnight
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utcDate.setUTCDate(utcDate.getUTCDate() - offsetDays);
  return utcDate.toISOString().split('T')[0];
}

function getUtcDateLabel(offsetDays: number, t: ReturnType<typeof useTranslations>, locale: string): string {
  if (offsetDays === 0) return t('today');
  if (offsetDays === 1) return t('yesterday');
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utcDate.setUTCDate(utcDate.getUTCDate() - offsetDays);
  return utcDate.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function DayFilterBar({
  selectedDate,
  onDateChange,
  className,
}: DayFilterBarProps) {
  const t = useTranslations('feed.dayFilter');
  const locale = useLocale();

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto scroll-smooth snap-x px-4 h-12',
        'bg-black border-b border-neutral-800',
        'scrollbar-hide',
        className
      )}
      role="tablist"
      aria-label={t('selectDay')}
    >
      {/* Today - 6 days ago (all in UTC) */}
      {Array.from({ length: 7 }).map((_, i) => {
        const dateStr = getUtcDateString(i);
        const isToday = i === 0;
        const isYesterday = i === 1;
        const isActive = dateStr === selectedDate;

        const label = getUtcDateLabel(i, t, locale);

        return (
          <DayChip
            key={dateStr}
            date={dateStr}
            label={label}
            isActive={isActive}
            onClick={() => onDateChange(dateStr)}
          />
        );
      })}
    </div>
  );
}
