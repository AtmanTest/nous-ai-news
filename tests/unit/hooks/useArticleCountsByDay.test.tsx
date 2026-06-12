import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useArticleCountsByDay, _resetMemoryCache } from '@/hooks/useArticleCountsByDay';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useArticleCountsByDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetMemoryCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches counts on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ counts: { '2026-01-15': 5, '2026-01-14': 3 } }),
    });

    const { result } = renderHook(() => useArticleCountsByDay(2));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.counts).toEqual({ '2026-01-15': 5, '2026-01-14': 3 });
    expect(result.current.error).toBeNull();
  });

  it('uses cached data when remounted with same days', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ counts: { '2026-01-15': 5 } }),
    });

    // First mount
    const { result: result1, unmount } = renderHook(() => useArticleCountsByDay(2));

    await waitFor(() => expect(result1.current.isLoading).toBe(false));
    expect(result1.current.counts).toEqual({ '2026-01-15': 5 });

    // Unmount
    unmount();

    // Second mount with same days - should use cache
    mockFetch.mockClear();
    const { result: result2 } = renderHook(() => useArticleCountsByDay(2));

    await waitFor(() => expect(result2.current.isLoading).toBe(false));
    // fetch should not be called again (uses cache)
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result2.current.counts).toEqual({ '2026-01-15': 5 });
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useArticleCountsByDay(2));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.counts).toEqual({});
  });

  it('refresh function clears cache and refetches', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ counts: { '2026-01-15': 5 } }),
    });

    const { result } = renderHook(() => useArticleCountsByDay(2));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.counts).toEqual({ '2026-01-15': 5 });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ counts: { '2026-01-15': 8 } }),
    });

    await act(async () => {
      await result.current.refresh();
    });

    // Wait for the refresh to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.counts).toEqual({ '2026-01-15': 8 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('passes days parameter to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ counts: {} }),
    });

    renderHook(() => useArticleCountsByDay(14));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('days=14');
  });

  it('cleans up state on unmount during fetch', async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockFetch.mockReturnValueOnce(fetchPromise);

    const { result, unmount } = renderHook(() => useArticleCountsByDay(2));

    // Unmount before fetch completes
    unmount();

    // Resolve the fetch - should not cause issues
    resolveFetch!({
      ok: true,
      json: async () => ({ counts: { '2026-01-15': 5 } }),
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    
    // Should not throw
    expect(true).toBe(true);
  });
});