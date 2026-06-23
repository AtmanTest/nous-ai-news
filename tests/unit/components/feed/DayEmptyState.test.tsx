import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayEmptyState } from '@/components/feed/DayEmptyState';
import { DaySeparator } from '@/components/feed/DaySeparator';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

const mockTranslationMaps: Record<string, Record<string, string>> = {
  'feed.dayFilter.emptyState': {
    'title': 'No articles for this day',
    'subtitle': 'Try another day',
    'goBack': 'Previous day',
  },
  'feed.dayFilter': {
    // ICU MessageFormat for pluralization
    'articlesCount': '{count, plural, one {# article} other {# articles}}',
  },
};

const mockTranslateFactory = (namespace: string) => {
  const dict = mockTranslationMaps[namespace] || {};
  return vi.fn((key: string, params?: Record<string, unknown>) => {
    let result = dict[key] || `${namespace}.${key}`;
    if (params?.count !== undefined) {
      // Simple ICU plural handling for tests: one vs other
      const count = params.count as number;
      if (count === 1) {
        // Extract the "one" branch
        const match = result.match(/one\s*{([^}]+)}/);
        result = match ? match[1].replace('#', String(count)) : result.replace('{count}', String(count));
      } else {
        // Extract the "other" branch
        const match = result.match(/other\s*{([^}]+)}/);
        result = match ? match[1].replace('#', String(count)) : result.replace('{count}', String(count));
      }
    }
    return result;
  });
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => mockTranslateFactory(ns),
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

describe('DayEmptyState', () => {
  it('renders title and formatted date', () => {
    render(
      React.createElement(DayEmptyState, { date: '2026-01-15', onGoToPreviousDay: vi.fn() })
    );

    expect(screen.getByText('No articles for this day')).toBeInTheDocument();
    // toLocaleDateString with month=long, day=numeric gives "Thursday, January 15" or similar
    expect(screen.getByText(/January 15|15 January|Jan 15/i)).toBeInTheDocument();
  });

  it('calls onGoToPreviousDay when button clicked', () => {
    const onGoToPreviousDay = vi.fn();
    render(
      React.createElement(DayEmptyState, { date: '2026-01-15', onGoToPreviousDay })
    );

    const button = screen.getByRole('button', { name: /Previous day/ });
    fireEvent.click(button);

    expect(onGoToPreviousDay).toHaveBeenCalledTimes(1);
  });

  it('has proper ARIA attributes', () => {
    render(
      React.createElement(DayEmptyState, { date: '2026-01-15', onGoToPreviousDay: vi.fn() })
    );

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('applies custom className', () => {
    const { container } = render(
      React.createElement(DayEmptyState, {
        date: '2026-01-15',
        onGoToPreviousDay: vi.fn(),
        className: 'custom-empty-class',
      })
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-empty-class');
  });
});

describe('DaySeparator', () => {
  it('renders label and article count', () => {
    render(
      React.createElement(DaySeparator, { label: 'Today', count: 5 })
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('5 articles')).toBeInTheDocument();
  });

  it('uses singular "article" for count of 1', () => {
    render(
      React.createElement(DaySeparator, { label: 'Yesterday', count: 1 })
    );

    expect(screen.getByText('1 article')).toBeInTheDocument();
  });

  it('has Calendar icon', () => {
    render(
      React.createElement(DaySeparator, { label: 'Today', count: 3 })
    );

    const calendarIcon = document.querySelector('[class*="lucide-calendar"]');
    expect(calendarIcon).toBeInTheDocument();
  });

  it('has sticky positioning and divider lines', () => {
    const { container } = render(
      React.createElement(DaySeparator, { label: 'Today', count: 2 })
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('sticky');
    expect(wrapper).toHaveClass('top-0');
    expect(wrapper).toHaveClass('border-t');
    expect(wrapper).toHaveClass('bg-background/80');
    expect(wrapper).toHaveClass('backdrop-blur-sm');
  });

  it('is hidden from screen readers (aria-hidden)', () => {
    const { container } = render(
      React.createElement(DaySeparator, { label: 'Today', count: 2 })
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(
      React.createElement(DaySeparator, {
        label: 'Today',
        count: 1,
        className: 'custom-separator-class',
      })
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-separator-class');
  });
});