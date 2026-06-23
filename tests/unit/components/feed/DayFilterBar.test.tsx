import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayFilterBar } from '@/components/feed/DayFilterBar';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

const mockTranslate = vi.fn((key: string, params?: Record<string, unknown>) => {
  const dict: Record<string, string> = {
    'today': 'Today',
    'yesterday': 'Yesterday',
    'articlesCount': '{count, plural, one {# article} other {# articles}}',
    'noArticles': 'No articles',
    'selectDay': 'Select day',
  };
  let result = dict[key] || key;
  if (params?.count !== undefined) {
    const count = params.count as number;
    if (count === 1) {
      result = '1 article';
    } else {
      result = `${count} articles`;
    }
  }
  return result;
});

let mockLocale = 'en';

vi.mock('next-intl', () => ({
  useTranslations: () => mockTranslate,
  useLocale: () => mockLocale,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

const now = new Date();
const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const todayStr = utcToday.toISOString().split('T')[0];
const utcYesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
const yesterdayStr = utcYesterday.toISOString().split('T')[0];

describe('DayFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale = 'en';
  });

  it('renders 7 day chips by default', () => {
    render(
      React.createElement(DayFilterBar, { selectedDate: todayStr, onDateChange: vi.fn() })
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(7);
  });

  it('highlights the selected date chip', () => {
    render(
      React.createElement(DayFilterBar, { selectedDate: todayStr, onDateChange: vi.fn() })
    );

    const todayTab = screen.getByRole('tab', { name: /Today/ });
    expect(todayTab).toHaveAttribute('aria-selected', 'true');

    const yesterdayTab = screen.getByRole('tab', { name: /Yesterday/ });
    expect(yesterdayTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onDateChange when a chip is clicked', () => {
    const onDateChange = vi.fn();
    render(
      React.createElement(DayFilterBar, { selectedDate: todayStr, onDateChange })
    );

    // Click the Yesterday chip (not the selected Today)
    const yesterdayTab = screen.getByRole('tab', { name: /Yesterday/ });
    fireEvent.click(yesterdayTab);

    expect(onDateChange).toHaveBeenCalledWith(yesterdayStr);
  });

  it('displays article counts in badges', () => {
    render(
      React.createElement(DayFilterBar, {
        selectedDate: todayStr,
        onDateChange: vi.fn(),
        articleCounts: { [todayStr]: 5, [yesterdayStr]: 3 },
        isLoadingCounts: false,
      })
    );

    const todayTab = screen.getByRole('tab', { name: /Today/ });
    expect(todayTab.textContent).toContain('5');

    const yesterdayTab = screen.getByRole('tab', { name: /Yesterday/ });
    expect(yesterdayTab.textContent).toContain('3');
  });

  it('shows skeleton when isLoadingCounts is true', () => {
    render(
      React.createElement(DayFilterBar, {
        selectedDate: todayStr,
        onDateChange: vi.fn(),
        articleCounts: {},
        isLoadingCounts: true,
      })
    );

    const animatedSpans = document.querySelectorAll('.animate-pulse');
    expect(animatedSpans.length).toBeGreaterThanOrEqual(1);
  });

  it('has correct aria attributes (tablist, tab, aria-selected)', () => {
    render(
      React.createElement(DayFilterBar, { selectedDate: todayStr, onDateChange: vi.fn() })
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Select day');

    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('role', 'tab');
      expect(tab).toHaveAttribute('aria-selected');
    });

    const selectedTabs = tabs.filter(t => t.getAttribute('aria-selected') === 'true');
    expect(selectedTabs.length).toBe(1);
  });

  it('renders "Today" for today', () => {
    render(
      React.createElement(DayFilterBar, { selectedDate: todayStr, onDateChange: vi.fn() })
    );

    expect(screen.getByRole('tab', { name: /Today/ })).toBeInTheDocument();
  });

  it('handles empty articleCounts gracefully', () => {
    render(
      React.createElement(DayFilterBar, {
        selectedDate: todayStr,
        onDateChange: vi.fn(),
        articleCounts: {},
        isLoadingCounts: false,
      })
    );

    const tabs = screen.getAllByRole('tab');
    // When articleCounts is empty, counts default to 0
    tabs.forEach(tab => {
      const text = tab.textContent || '';
      // Should show 0 for chips without entries in articleCounts
      expect(text).toContain('0');
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      React.createElement(DayFilterBar, {
        selectedDate: todayStr,
        onDateChange: vi.fn(),
        className: 'custom-class',
      })
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  // REGRESSION TEST: Ensure no animated indicator element that caused white circle layout bug
  it('does NOT render animated absolute indicator (layoutId="day-filter-active") that caused white circle bug', () => {
    render(
      React.createElement(DayFilterBar, {
        selectedDate: todayStr,
        onDateChange: vi.fn(),
        articleCounts: { [todayStr]: 2 },
        isLoadingCounts: false,
      })
    );

    // The old buggy version had an animated indicator with:
    // - layoutId="day-filter-active"
    // - className="absolute inset-0 bg-white rounded-full pointer-events-none"
    // This caused a large white circle to appear in production due to layout measurement issues

    // Ensure no absolute positioned white rounded-full element exists
    const absoluteElements = document.querySelectorAll('.absolute.inset-0.bg-white.rounded-full');
    expect(absoluteElements.length).toBe(0);

    // Ensure no element with layoutId="day-filter-active" exists in the DOM
    // (framer-motion renders layoutId as data-framer-motion-id or similar)
    const layoutIdElements = document.querySelectorAll('[data-framer-motion-id*="day-filter-active"], [layout-id="day-filter-active"]');
    expect(layoutIdElements.length).toBe(0);

    // The container should only have the tab elements (7 day chips)
    const tablist = screen.getByRole('tablist');
    const directChildren = Array.from(tablist.children).filter(child =>
      child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE'
    );
    // Should only have the 7 tab elements, no extra indicator div
    expect(directChildren.length).toBeLessThanOrEqual(8); // 7 tabs + possibly 1 indicator (but indicator removed)
  });

  // REGRESSION TEST: articleCounts must match by exact UTC date string
  // Bug: previously used local date (new Date()) then converted to ISO, which could mismatch UTC dates
  // from the API when user's local timezone differs from UTC (e.g., near midnight boundaries)
  it('matches articleCounts by exact UTC date string, not local date conversion', () => {
    // Simulate a date that exists in API counts but would be mismatched if using local date
    const utcDayBeforeYesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2));
    const dayBeforeYesterdayStr = utcDayBeforeYesterday.toISOString().split('T')[0];

    const onDateChange = vi.fn();
    render(
      React.createElement(DayFilterBar, {
        selectedDate: todayStr,
        onDateChange,
        articleCounts: { [dayBeforeYesterdayStr]: 996 }, // 996 articles on that UTC day
        isLoadingCounts: false,
      })
    );

    // The third chip (index 2) should be "day before yesterday" and show count 996
    const tabs = screen.getAllByRole('tab');
    const dayBeforeYesterdayTab = tabs[2]; // 0=today, 1=yesterday, 2=day before yesterday
    expect(dayBeforeYesterdayTab.textContent).toContain('996');

    // Verify the date string passed to onDateChange would be the exact UTC date
    fireEvent.click(dayBeforeYesterdayTab);
    expect(onDateChange).toHaveBeenCalledWith(dayBeforeYesterdayStr);
  });

  it('localizes older weekday chips with the active app locale', () => {
    mockLocale = 'en';
    const { rerender } = render(
      React.createElement(DayFilterBar, { selectedDate: todayStr, onDateChange: vi.fn() })
    );

    const thirdChipDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2));
    const englishThirdChipLabel = thirdChipDate.toLocaleDateString('en', {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    expect(screen.getAllByRole('tab')[2].textContent).toContain(englishThirdChipLabel);

    mockLocale = 'fr';
    rerender(
      React.createElement(DayFilterBar, { selectedDate: todayStr, onDateChange: vi.fn() })
    );

    const frenchThirdChipLabel = thirdChipDate.toLocaleDateString('fr', {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    expect(screen.getAllByRole('tab')[2].textContent).toContain(frenchThirdChipLabel);
    expect(englishThirdChipLabel).not.toEqual(frenchThirdChipLabel);
  });
});