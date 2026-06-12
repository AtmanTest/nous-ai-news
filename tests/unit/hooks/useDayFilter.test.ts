import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useDayFilter } from '@/hooks/useDayFilter';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

// ─── Mock next/navigation ────────────────────────────────────
const mockSearchParams = vi.fn();
const mockRouter = vi.fn();
const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
  useRouter: () => mockRouter(),
  usePathname: () => mockPathname(),
}));

// ─── Mock next-intl ──────────────────────────────────────────
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const dict: Record<string, Record<string, string>> = {
      'feed.dayFilter': {
        today: 'Today',
        yesterday: 'Yesterday',
      },
    };
    return (key: string) => dict['feed.dayFilter']?.[key] || key;
  },
  NextIntlClientProvider: ({ children }: { children: React.ReactNode; messages?: Record<string, unknown>; locale?: string }) =>
    React.createElement(React.Fragment, null, children),
}));

const providerProps = { messages: {}, locale: 'en' };
const TestComponent = () => {
  const result = useDayFilter();
  return React.createElement('div', { 'data-testid': 'result', 'data-selected': result.selectedDate });
};

function renderHook() {
  return render(
    React.createElement(NextIntlClientProvider, providerProps, React.createElement(TestComponent))
  );
}

const today = new Date();
const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
const todayStr = utcToday.toISOString().split('T')[0];
const yesterdayStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1)).toISOString().split('T')[0];
const threeDaysAgoStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 3)).toISOString().split('T')[0];

describe('useDayFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/feed');
    mockRouter.mockImplementation(() => ({ replace: vi.fn() }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('defaults to today when no URL param', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''));

    const { getByTestId } = renderHook();
    const el = getByTestId('result');
    expect(el.dataset.selected).toBe(todayStr);
  });

  it('reads date from URL searchParams', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams('date=' + threeDaysAgoStr));

    const { getByTestId } = renderHook();
    const el = getByTestId('result');
    expect(el.dataset.selected).toBe(threeDaysAgoStr);
  });

  it('updates URL when setSelectedDate is called', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''));
    const replace = vi.fn();
    mockRouter.mockReturnValue({ replace });

    const ButtonComponent = () => {
      const { setSelectedDate } = useDayFilter();
      return React.createElement('button', { onClick: () => setSelectedDate(threeDaysAgoStr) }, 'Set');
    };

    render(
      React.createElement(NextIntlClientProvider, providerProps, React.createElement(ButtonComponent))
    );

    screen.getByText('Set').click();

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining('date=' + threeDaysAgoStr),
      { scroll: false }
    );
  });

  it('canGoNext is false when today is selected', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''));

    const CanGoNextComponent = () => {
      const { canGoNext } = useDayFilter();
      return React.createElement('span', { 'data-testid': 'can-go-next' }, String(canGoNext));
    };

    render(
      React.createElement(NextIntlClientProvider, providerProps, React.createElement(CanGoNextComponent))
    );

    expect(screen.getByTestId('can-go-next').textContent).toBe('false');
  });

  it('canGoPrevious is false when 7 days ago is selected', () => {
    const sevenDaysAgoStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6)).toISOString().split('T')[0];
    mockSearchParams.mockReturnValue(new URLSearchParams('date=' + sevenDaysAgoStr));

    const CanGoPreviousComponent = () => {
      const { canGoPrevious } = useDayFilter();
      return React.createElement('span', { 'data-testid': 'can-go-previous' }, String(canGoPrevious));
    };

    render(
      React.createElement(NextIntlClientProvider, providerProps, React.createElement(CanGoPreviousComponent))
    );

    expect(screen.getByTestId('can-go-previous').textContent).toBe('false');
  });

  it('generates 7 DayOption items', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''));

    const DayCountComponent = () => {
      const { days } = useDayFilter();
      return React.createElement('span', { 'data-testid': 'day-count' }, days.length);
    };

    render(
      React.createElement(NextIntlClientProvider, providerProps, React.createElement(DayCountComponent))
    );

    expect(screen.getByTestId('day-count').textContent).toBe('7');
  });

  it('correctly marks isToday and isSelected', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''));

    const IsTodaySelectedComponent = () => {
      const { days } = useDayFilter();
      const todayOption = days.find(d => d.isToday);
      return React.createElement('span', { 'data-testid': 'is-today-selected' }, String(todayOption?.isSelected));
    };

    render(
      React.createElement(NextIntlClientProvider, providerProps, React.createElement(IsTodaySelectedComponent))
    );

    expect(screen.getByTestId('is-today-selected').textContent).toBe('true');
  });

  it('does not allow future dates', () => {
    const futureStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)).toISOString().split('T')[0];
    mockSearchParams.mockReturnValue(new URLSearchParams('date=' + futureStr));

    const { getByTestId } = renderHook();
    const el = getByTestId('result');
    expect(el.dataset.selected).toBe(todayStr);
  });
});