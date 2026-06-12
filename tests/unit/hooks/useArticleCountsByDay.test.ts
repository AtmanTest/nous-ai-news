import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useArticleCountsByDay, _resetMemoryCache } from '@/hooks/useArticleCountsByDay';
import React from 'react';

// ─── Mock fetch ──────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ─── Test helpers ────────────────────────────────────────────
const TestComponent = ({ days = 7 }: { days?: number }) => {
  const result = useArticleCountsByDay(days);
  return React.createElement('div', {
    'data-testid': 'counts-result',
    'data-counts': JSON.stringify(result.counts),
    'data-loading': String(result.isLoading),
    'data-error': result.error || '',
  });
};

describe('useArticleCountsByDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetMemoryCache();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('fetches counts from API on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ counts: { '2026-01-01': 5, '2026-01-02': 3 } }),
    });

    render(React.createElement(TestComponent));

    expect(screen.getByTestId('counts-result').dataset.loading).toBe('true');

    await waitFor(() => {
      expect(screen.getByTestId('counts-result').dataset.loading).toBe('false');
    }, { timeout: 2000 });

    const counts = JSON.parse(screen.getByTestId('counts-result').dataset.counts);
    expect(counts['2026-01-01']).toBe(5);
    expect(counts['2026-01-02']).toBe(3);
  });

  it('handles API error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(React.createElement(TestComponent));

    await waitFor(() => {
      expect(screen.getByTestId('counts-result').dataset.loading).toBe('false');
    }, { timeout: 2000 });

    expect(screen.getByTestId('counts-result').dataset.error ?? '').toBeTruthy();
    expect(screen.getByTestId('counts-result').dataset.counts).toBe('{}');
  });

  it('returns empty counts on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(React.createElement(TestComponent));

    await waitFor(() => {
      expect(screen.getByTestId('counts-result').dataset.loading).toBe('false');
    }, { timeout: 2000 });

    expect(screen.getByTestId('counts-result').dataset.error ?? '').toBeTruthy();
  });

  it('respects days parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ counts: {} }),
    });

    const { rerender } = render(React.createElement(TestComponent, { days: 14 }));

    await waitFor(() => {
      expect(screen.getByTestId('counts-result').dataset.loading).toBe('false');
    }, { timeout: 2000 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('days=14')
    );
  });

  it('exposes refresh function', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ counts: { '2026-01-01': 5 } }),
    });

    const TestWithRefresh = () => {
      const result = useArticleCountsByDay();
      return React.createElement('div', {
        'data-testid': 'refresh-result',
        'data-counts': JSON.stringify(result.counts),
      }, React.createElement('button', {
        onClick: () => result.refresh(),
        'data-testid': 'refresh-btn',
      }, 'Refresh'));
    };

    render(React.createElement(TestWithRefresh));

    await waitFor(() => {
      expect(screen.getByTestId('refresh-result').dataset.counts).toContain('2026-01-01');
    }, { timeout: 2000 });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      screen.getByTestId('refresh-btn').click();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, { timeout: 2000 });
  });
});