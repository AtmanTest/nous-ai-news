'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export interface DayOption {
  date: string; // 'YYYY-MM-DD'
  label: string; // 'Aujourd\'hui' | 'Hier' | 'Lun 02'
  isToday: boolean;
  isSelected: boolean;
}

export interface UseDayFilterReturn {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  days: DayOption[];
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function useDayFilter(): UseDayFilterReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('feed');

  // Helper to get UTC date string at midnight
  const getUtcTodayStr = useCallback(() => {
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return utcDate.toISOString().split('T')[0];
  }, []);

  const todayStr = getUtcTodayStr();
  const urlDate = searchParams.get('date');
  const selectedDate = urlDate && urlDate <= todayStr ? urlDate : todayStr;

  const days = useMemo((): DayOption[] => {
    const result: DayOption[] = [];
    for (let i = 0; i < 7; i++) {
      const now = new Date();
      const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      utcDate.setUTCDate(utcDate.getUTCDate() - i);
      const dateStr = utcDate.toISOString().split('T')[0];
      const isToday = i === 0;
      const isYesterday = i === 1;
      let label: string;
      if (isToday) label = t('dayFilter.today');
      else if (isYesterday) label = t('dayFilter.yesterday');
      else label = utcDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
      result.push({
        date: dateStr,
        label,
        isToday,
        isSelected: dateStr === selectedDate,
      });
    }
    return result;
  }, [selectedDate, t]);

  const setSelectedDate = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const today = getUtcTodayStr();
      if (date === today) {
        params.delete('date');
      } else {
        params.set('date', date);
      }
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router, getUtcTodayStr]
  );

  const currentIndex = days.findIndex(d => d.date === selectedDate);
  const canGoNext = currentIndex > 0;
  const canGoPrevious = currentIndex < days.length - 1 && currentIndex !== -1;

  const goToNextDay = useCallback(() => {
    if (!canGoNext) return;
    const nextDay = days[currentIndex - 1];
    setSelectedDate(nextDay.date);
  }, [currentIndex, canGoNext, days, setSelectedDate]);

  const goToPreviousDay = useCallback(() => {
    if (!canGoPrevious) return;
    const prevDay = days[currentIndex + 1];
    setSelectedDate(prevDay.date);
  }, [currentIndex, canGoPrevious, days, setSelectedDate]);

  return {
    selectedDate,
    setSelectedDate,
    days,
    goToPreviousDay,
    goToNextDay,
    canGoNext,
    canGoPrevious,
  };
}