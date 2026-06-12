import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Next navigation mocks ──────────────────────────────────────────────
const mockUseSearchParams = vi.fn();
const mockUseRouter = vi.fn();
const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: (...args: unknown[]) => mockUseSearchParams(...args),
  useRouter: (...args: unknown[]) => mockUseRouter(...args),
  usePathname: (...args: unknown[]) => mockUsePathname(...args),
}));

// ── Global fetch mock ──────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Helpers ────────────────────────────────────────────────────────────
const mockRouter = { replace: vi.fn() };
const defaultArticles = [
  { id: '1', title: 'Article 1', summary: 'Sum 1', image_url: null, source_name: 'Src', category: 'general', tags: [], published_at: '2025-01-01', score: 10, is_breaking: false },
  { id: '2', title: 'Article 2', summary: 'Sum 2', image_url: null, source_name: 'Src', category: 'general', tags: [], published_at: '2025-01-02', score: 8, is_breaking: false },
];

function fetchResponse(overrides: Partial<{
  articles: typeof defaultArticles;
  nextCursor: string | null;
  hasMore: boolean;
}> = {}) {
  return {
    ok: true,
    json: () => Promise.resolve({
      articles: overrides.articles ?? [],
      nextCursor: overrides.nextCursor ?? null,
      hasMore: overrides.hasMore ?? false,
    }),
  };
}

function fetchError() {
  return { ok: false, status: 500 };
}

// ── Module to test ─────────────────────────────────────────────────────
import { useFeed } from '@/hooks/useFeed';

describe('useFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUseRouter.mockReturnValue(mockRouter);
    mockUsePathname.mockReturnValue('/feed');

    // Default fetch: empty, no more
    mockFetch.mockResolvedValue(fetchResponse());
  });

  // ──────────────────────────────────────────────────────────────────────
  // Tab defaults & URL reading
  // ──────────────────────────────────────────────────────────────────────
  describe('tab state', () => {
    it('defaults to latest when no URL param', () => {
      const { result } = renderHook(() => useFeed());
      expect(result.current.activeTab).toBe('latest');
    });

    it('reads tab from URL search params', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=trending'));
      const { result } = renderHook(() => useFeed());
      expect(result.current.activeTab).toBe('trending');
    });

    it('reads for-you tab from URL', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=for-you'));
      const { result } = renderHook(() => useFeed());
      expect(result.current.activeTab).toBe('for-you');
    });

    it('falls back to latest for invalid tab names', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=invalid-tab'));
      const { result } = renderHook(() => useFeed());
      expect(result.current.activeTab).toBe('latest');
    });

    it('falls back to latest for empty tab param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab='));
      const { result } = renderHook(() => useFeed());
      expect(result.current.activeTab).toBe('latest');
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // setTab
  // ──────────────────────────────────────────────────────────────────────
  describe('setTab', () => {
    it('updates URL via router.replace with non-default tab', () => {
      const { result } = renderHook(() => useFeed());
      act(() => result.current.setTab('trending'));
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/feed?tab=trending',
        { scroll: false },
      );
    });

    it('removes tab param from URL when switching to latest', () => {
      // Start on trending
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=trending'));
      const { result } = renderHook(() => useFeed());
      act(() => result.current.setTab('latest'));
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/feed',
        { scroll: false },
      );
    });

    it('does nothing when setting the same tab', () => {
      const { result } = renderHook(() => useFeed());
      act(() => result.current.setTab('latest'));
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('preserves other URL params when switching tab', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('source=techcrunch'));
      const { result } = renderHook(() => useFeed());
      act(() => result.current.setTab('for-you'));
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/feed?source=techcrunch&tab=for-you',
        { scroll: false },
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Fetch behaviour
  // ──────────────────────────────────────────────────────────────────────
  describe('fetch', () => {
    it('triggers initial fetch on mount', () => {
      renderHook(() => useFeed());
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain('/api/news?');
    });

    it('passes tab and limit to the API URL', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=trending'));
      renderHook(() => useFeed());
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('tab=trending');
      expect(url).toContain('limit=20');
    });

    it('sets isLoading to true during fetch, then false on completion', async () => {
      // Hold the fetch open
      let resolveFetch!: (v: unknown) => void;
      mockFetch.mockReturnValue(new Promise(r => { resolveFetch = r; }));

      const { result } = renderHook(() => useFeed());
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveFetch(fetchResponse());
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('populates articles after successful fetch', async () => {
      mockFetch.mockResolvedValue(fetchResponse({ articles: defaultArticles }));

      const { result } = renderHook(() => useFeed());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.articles).toHaveLength(2);
      expect(result.current.articles[0].id).toBe('1');
    });

    it('sets hasMore from the API response', async () => {
      mockFetch.mockResolvedValue(fetchResponse({
        articles: defaultArticles,
        hasMore: true,
        nextCursor: 'cursor-abc',
      }));

      const { result } = renderHook(() => useFeed());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.hasMore).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Error state
  // ──────────────────────────────────────────────────────────────────────
  describe('error state', () => {
    it('sets error when fetch fails (network error)', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useFeed());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('Network failure');
      expect(result.current.articles).toHaveLength(0);
    });

    it('sets error when API returns non-ok status', async () => {
      mockFetch.mockResolvedValue(fetchError());

      const { result } = renderHook(() => useFeed());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('Failed to fetch feed');
    });

    it('clears previous error on subsequent successful fetch (via refresh)', async () => {
      // First fetch fails
      mockFetch.mockRejectedValue(new Error('First fail'));

      const { result } = renderHook(() => useFeed());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('First fail');

      // Refresh with success
      mockFetch.mockResolvedValue(fetchResponse({ articles: defaultArticles }));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.articles).toHaveLength(2);
    });

    it('handles non-Error thrown values gracefully', async () => {
      mockFetch.mockRejectedValue('just a string');

      const { result } = renderHook(() => useFeed());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('An error occurred');
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // loadMore
  // ──────────────────────────────────────────────────────────────────────
  describe('loadMore', () => {
    it('appends articles when loadMore is called', async () => {
      mockFetch.mockResolvedValue(fetchResponse({
        articles: [defaultArticles[0]],
        nextCursor: 'cursor-abc',
        hasMore: true,
      }));

      const { result } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // For loadMore, we need the second fetch to return article 2
      // Use a call-counter approach to return different values
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('cursor=cursor-abc')) {
          return Promise.resolve(fetchResponse({
            articles: [defaultArticles[1]],
            nextCursor: null,
            hasMore: false,
          }));
        }
        return Promise.resolve(fetchResponse({
          articles: [defaultArticles[0]],
          nextCursor: 'cursor-abc',
          hasMore: true,
        }));
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.articles).toHaveLength(2);
        expect(result.current.articles[0].id).toBe('1');
        expect(result.current.articles[1].id).toBe('2');
      });
    });

    it('sends cursor in the request URL', async () => {
      mockFetch.mockResolvedValue(fetchResponse({
        articles: [defaultArticles[0]],
        nextCursor: 'cursor-abc',
        hasMore: true,
      }));

      const { result } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Call loadMore
      mockFetch.mockResolvedValue(fetchResponse({ articles: [defaultArticles[1]] }));

      await act(async () => {
        await result.current.loadMore();
      });

      // Second fetch should include cursor
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
      const url = mockFetch.mock.calls[1][0] as string;
      expect(url).toContain('cursor=cursor-abc');
    });

    it('does nothing when hasMore is false', async () => {
      mockFetch.mockResolvedValue(fetchResponse({
        articles: [defaultArticles[0]],
        nextCursor: null,
        hasMore: false,
      }));

      const { result } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Reset call count
      mockFetch.mockClear();

      await act(async () => {
        await result.current.loadMore();
      });

      // No additional fetch
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.articles).toHaveLength(1);
    });

    it('does nothing when isLoading is still true on initial load (guard)', async () => {
      // Hold the first fetch
      let resolveFetch!: (v: unknown) => void;
      mockFetch.mockReturnValue(new Promise(r => { resolveFetch = r; }));

      const { result } = renderHook(() => useFeed());

      // isLoading is still true, loadMore should be a no-op
      await act(async () => {
        await result.current.loadMore();
      });

      // Only the initial fetch was made
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('sets isLoadingMore during loadMore and clears it after', async () => {
      mockFetch.mockResolvedValue(fetchResponse({
        articles: [defaultArticles[0]],
        nextCursor: 'cursor-abc',
        hasMore: true,
      }));

      const { result } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Hold the second fetch
      let resolveFetch2!: (v: unknown) => void;
      mockFetch.mockReturnValue(new Promise(r => { resolveFetch2 = r; }));

      let promise: Promise<void>;
      act(() => {
        promise = result.current.loadMore();
      });

      await vi.waitFor(() => expect(result.current.isLoadingMore).toBe(true));

      await act(async () => {
        resolveFetch2(fetchResponse({ articles: [defaultArticles[1]] }));
        await promise!;
      });

      expect(result.current.isLoadingMore).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Tab change — requires simulating URL change + rerender
  // ──────────────────────────────────────────────────────────────────────
  describe('tab change', () => {
    it('resets articles when tab changes (via rerender with new URL param)', async () => {
      // Show some articles initially (latest tab)
      mockFetch.mockResolvedValue(fetchResponse({ articles: [defaultArticles[0]] }));

      const { result, rerender } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.articles).toHaveLength(1);

      // Prepare second fetch response
      mockFetch.mockResolvedValue(fetchResponse({ articles: [defaultArticles[1]] }));

      // Step 1: setTab updates the URL via router.replace
      act(() => {
        result.current.setTab('trending');
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/feed?tab=trending',
        { scroll: false },
      );

      // Step 2: Simulate Next.js URL change by updating the search params mock
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=trending'));

      // Step 3: Rerender the hook — this causes useSearchParams to return the new value,
      // which changes activeTab, which triggers the tab-change effect
      rerender();

      // Now the tab-change effect should have fired: articles reset, new fetch triggered
      await waitFor(() => {
        expect(result.current.articles).toHaveLength(1);
        expect(result.current.articles[0].id).toBe('2');
        expect(result.current.activeTab).toBe('trending');
      });
    });

    it('resets error when tab changes', async () => {
      mockFetch.mockRejectedValue(new Error('Oops'));

      const { result, rerender } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('Oops');

      // Switch tab
      mockFetch.mockResolvedValue(fetchResponse({ articles: [defaultArticles[0]] }));

      act(() => {
        result.current.setTab('trending');
      });
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=trending'));
      rerender();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.articles).toHaveLength(1);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // refresh
  // ──────────────────────────────────────────────────────────────────────
  describe('refresh', () => {
    it('clears existing articles and re-fetches', async () => {
      mockFetch.mockResolvedValue(fetchResponse({ articles: [defaultArticles[0]] }));

      const { result } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Change the default response before calling refresh
      mockFetch.mockResolvedValue(fetchResponse({ articles: [defaultArticles[1]] }));

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        // Articles should be replaced, not appended
        expect(result.current.articles).toHaveLength(1);
        expect(result.current.articles[0].id).toBe('2');
      });
    });

    it('resets cursor and hasMore on refresh', async () => {
      mockFetch.mockResolvedValue(fetchResponse({
        articles: [defaultArticles[0]],
        hasMore: false,
      }));

      const { result } = renderHook(() => useFeed());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.hasMore).toBe(false);

      mockFetch.mockResolvedValue(fetchResponse({
        articles: [defaultArticles[0]],
        hasMore: true,
        nextCursor: 'new-cursor',
      }));

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });
    });
  });
});
