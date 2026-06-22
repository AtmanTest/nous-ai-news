import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { FilteredFeed } from '@/components/news/FilteredFeed';

vi.mock('@/components/news/StoryCard', () => ({
  StoryCard: ({ title }: { title: string }) => <article>{title}</article>,
}));

const article = {
  id: 'a1',
  title: 'Hydration-safe article',
  summary: 'Summary',
  image_url: null,
  source_name: 'Test Source',
  category: 'models',
  tags: [],
  published_at: '2026-06-22T00:00:00Z',
  score: 50,
  is_breaking: false,
  content: 'Content',
  language: 'en',
};

describe('FilteredFeed', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps hook order stable when source-filter readiness flips after hydration', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<FilteredFeed featured={[article]} latest={[{ ...article, id: 'a2', title: 'Latest article' }]} />);

    await waitFor(() => {
      expect(screen.getByText('Hydration-safe article')).toBeInTheDocument();
      expect(screen.getByText('Latest article')).toBeInTheDocument();
    });

    const hookOrderErrors = consoleError.mock.calls
      .flat()
      .map((arg) => String(arg))
      .filter((message) => /Rendered more hooks|change in the order of Hooks|hydration/i.test(message));

    expect(hookOrderErrors).toEqual([]);
  });
});
