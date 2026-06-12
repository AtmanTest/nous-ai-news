import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import { useSourceFilter } from '@/hooks/useSourceFilter';

describe('useSourceFilter', () => {
  const SOURCE_A = 'TechCrunch';
  const SOURCE_B = 'The Verge';

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty hiddenSources', () => {
      const { result } = renderHook(() => useSourceFilter());
      expect(result.current.hiddenSources.size).toBe(0);
      expect(result.current.ready).toBe(true);
    });

    it('loads hidden sources from localStorage on mount', () => {
      localStorageMock.setItem('hidden-sources', JSON.stringify([SOURCE_A]));
      const { result } = renderHook(() => useSourceFilter());
      expect(result.current.hiddenSources.has(SOURCE_A)).toBe(true);
      expect(result.current.hiddenSources.size).toBe(1);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorageMock.setItem('hidden-sources', 'not-json');
      const { result } = renderHook(() => useSourceFilter());
      expect(result.current.hiddenSources.size).toBe(0);
      expect(result.current.ready).toBe(true);
    });
  });

  describe('hideSource', () => {
    it('adds a source to hiddenSources', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      expect(result.current.hiddenSources.has(SOURCE_A)).toBe(true);
      expect(result.current.hiddenSources.size).toBe(1);
    });

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hidden-sources',
        JSON.stringify([SOURCE_A])
      );
    });

    it('does not duplicate when hiding already hidden source', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      act(() => result.current.hideSource(SOURCE_A));
      expect(result.current.hiddenSources.size).toBe(1);
    });
  });

  describe('showSource', () => {
    it('removes a source from hiddenSources', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      act(() => result.current.hideSource(SOURCE_B));
      expect(result.current.hiddenSources.size).toBe(2);

      act(() => result.current.showSource(SOURCE_A));
      expect(result.current.hiddenSources.has(SOURCE_A)).toBe(false);
      expect(result.current.hiddenSources.has(SOURCE_B)).toBe(true);
      expect(result.current.hiddenSources.size).toBe(1);
    });

    it('updates localStorage after show', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      act(() => result.current.hideSource(SOURCE_B));
      act(() => result.current.showSource(SOURCE_A));
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        'hidden-sources',
        JSON.stringify([SOURCE_B])
      );
    });

    it('does nothing when showing a non-hidden source', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.showSource(SOURCE_A));
      expect(result.current.hiddenSources.size).toBe(0);
    });
  });

  describe('showAllSources', () => {
    it('resets all hidden sources at once', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      act(() => result.current.hideSource(SOURCE_B));
      expect(result.current.hiddenSources.size).toBe(2);

      act(() => result.current.showAllSources());
      expect(result.current.hiddenSources.size).toBe(0);
    });

    it('removes localStorage key entirely', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      act(() => result.current.showAllSources());
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hidden-sources');
    });

    it('works when no sources are hidden (no-op)', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.showAllSources());
      expect(result.current.hiddenSources.size).toBe(0);
    });

    it('clears multiple sources in one call', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      act(() => result.current.hideSource('Wired'));
      act(() => result.current.hideSource(SOURCE_B));
      act(() => result.current.hideSource('Ars Technica'));
      expect(result.current.hiddenSources.size).toBe(4);

      act(() => result.current.showAllSources());
      expect(result.current.hiddenSources.size).toBe(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hidden-sources');
    });
  });

  describe('toggleSource', () => {
    it('hides a visible source', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.toggleSource(SOURCE_A));
      expect(result.current.hiddenSources.has(SOURCE_A)).toBe(true);
    });

    it('shows a hidden source', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      act(() => result.current.toggleSource(SOURCE_A));
      expect(result.current.hiddenSources.has(SOURCE_A)).toBe(false);
    });
  });

  describe('isHidden', () => {
    it('returns true for hidden source', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource(SOURCE_A));
      expect(result.current.isHidden(SOURCE_A)).toBe(true);
    });

    it('returns false for visible source', () => {
      const { result } = renderHook(() => useSourceFilter());
      expect(result.current.isHidden(SOURCE_A)).toBe(false);
    });
  });

  describe('filterArticles', () => {
    const article = {
      id: '1',
      title: 'Test',
      source_name: 'TechCrunch',
    };

    it('returns all articles when no sources hidden', () => {
      const { result } = renderHook(() => useSourceFilter());
      const filtered = result.current.filterArticles([article]);
      expect(filtered).toHaveLength(1);
    });

    it('filters out articles from hidden sources', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource('TechCrunch'));
      const filtered = result.current.filterArticles([article]);
      expect(filtered).toHaveLength(0);
    });

    it('keeps articles from non-hidden sources', () => {
      const { result } = renderHook(() => useSourceFilter());
      act(() => result.current.hideSource('Wired'));
      const filtered = result.current.filterArticles([article]);
      expect(filtered).toHaveLength(1);
    });

    it('handles empty article list', () => {
      const { result } = renderHook(() => useSourceFilter());
      expect(result.current.filterArticles([])).toEqual([]);
    });

    it('handles articles without source_name', () => {
      const { result } = renderHook(() => useSourceFilter());
      const noSource = { id: '2', title: 'No Source', source_name: undefined };
      expect(result.current.filterArticles([noSource])).toHaveLength(1);
    });
  });
});
