import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RightPanel } from '@/components/layout/RightPanel';

// Mock next/link
vi.mock('next/link', () => ({
  default: React.forwardRef(({ children, href, ...props }: any, ref: any) =>
    React.createElement('a', { href, ...props, ref }, children)
  ),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  TrendingUp: (props: any) => React.createElement('svg', { 'data-testid': 'icon-TrendingUp', ...props }),
  Hash: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Hash', ...props }),
  Radio: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Radio', ...props }),
  Cpu: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Cpu', ...props }),
  Sparkles: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Sparkles', ...props }),
  ExternalLink: (props: any) => React.createElement('svg', { 'data-testid': 'icon-ExternalLink', ...props }),
  Search: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Search', ...props }),
  Loader2: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Loader2', ...props }),
  Download: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Download', ...props }),
  Heart: (props: any) => React.createElement('svg', { 'data-testid': 'icon-Heart', ...props }),
}));

// Mock cn utility and timeAgo
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  timeAgo: () => '2h ago',
}));

// Mock fetch for LatestModels API call
const mockFetchModels = vi.fn();
global.fetch = mockFetchModels;

describe('RightPanel', () => {
  const defaultTrending = [
    { title: 'GPT-5 Launch Announced', id: 'trend-1', score: 0.95, source_name: 'OpenAI', trend_count: 1200 },
    { title: 'Quantum Computing Breakthrough', id: 'trend-2', score: 0.88, source_name: 'Google AI', trend_count: 850 },
    { title: 'New Open Source Model Released', id: 'trend-3', score: 0.76, source_name: 'HuggingFace', trend_count: 620 },
  ];

  const defaultTopics = ['AI', 'Machine Learning', 'Deep Learning', 'Robotics'];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default fetch mock: return model data for LatestModels
    mockFetchModels.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        models: [
          { name: 'LocateAnything-3B', author: 'nvidia', id: 'nvidia/LocateAnything-3B', task: 'image-text-to-text', downloads: 122000, likes: 1600, params: '4B', updated: new Date(Date.now() - 12 * 86400000).toISOString(), link: 'https://huggingface.co/nvidia/LocateAnything-3B' },
          { name: 'gemma-4-12B-it', author: 'google', id: 'google/gemma-4-12B-it', task: 'any-to-any', downloads: 554000, likes: 733, params: '12B', updated: new Date(Date.now() - 4 * 86400000).toISOString(), link: 'https://huggingface.co/google/gemma-4-12B-it' },
          { name: 'ideogram-4-fp8', author: 'ideogram-ai', id: 'ideogram-ai/ideogram-4-fp8', task: 'text-to-image', downloads: 5500, likes: 382, params: '', updated: new Date(Date.now() - 5 * 86400000).toISOString(), link: 'https://huggingface.co/ideogram-ai/ideogram-4-fp8' },
        ],
      }),
    });
  });

  it('renders the search bar input', () => {
    render(React.createElement(RightPanel));
    const input = screen.getByPlaceholderText('Search AI News');
    expect(input).toBeInTheDocument();
  });

  it('renders search icon inside search form', () => {
    render(React.createElement(RightPanel));
    expect(screen.getByTestId('icon-Search')).toBeInTheDocument();
  });

  it('submits search form and navigates to /search?q=...', () => {
    render(React.createElement(RightPanel));
    const input = screen.getByPlaceholderText('Search AI News');
    const form = input.closest('form')!;
    fireEvent.input(input, { target: { value: 'deep learning' } });
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(mockPush).toHaveBeenCalledWith('/search?q=deep%20learning');
  });

  it('does not navigate on empty search query', () => {
    render(React.createElement(RightPanel));
    const form = document.querySelector('form')!;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('trims whitespace from search query before navigating', () => {
    render(React.createElement(RightPanel));
    const input = screen.getByPlaceholderText('Search AI News');
    const form = input.closest('form')!;
    fireEvent.input(input, { target: { value: '  hello  ' } });
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(mockPush).toHaveBeenCalledWith('/search?q=hello');
  });

  it('renders "Trending AI Topics" widget when trending items are provided', () => {
    render(React.createElement(RightPanel, { trending: defaultTrending }));
    expect(screen.getByText('Trending AI Topics')).toBeInTheDocument();
  });

  it('does not render trending widget when trending is empty', () => {
    render(React.createElement(RightPanel, { trending: [] }));
    expect(screen.queryByText('Trending AI Topics')).not.toBeInTheDocument();
  });

  it('renders all trending items with titles', () => {
    render(React.createElement(RightPanel, { trending: defaultTrending }));
    expect(screen.getByText('GPT-5 Launch Announced')).toBeInTheDocument();
    expect(screen.getByText('Quantum Computing Breakthrough')).toBeInTheDocument();
    expect(screen.getByText('New Open Source Model Released')).toBeInTheDocument();
  });

  it('shows ranking numbers for trending items', () => {
    render(React.createElement(RightPanel, { trending: defaultTrending }));
    expect(screen.getByText('01 · Trending')).toBeInTheDocument();
    expect(screen.getByText('02 · Trending')).toBeInTheDocument();
    expect(screen.getByText('03 · Trending')).toBeInTheDocument();
  });

  it('shows source name and post count for items with score', () => {
    render(React.createElement(RightPanel, { trending: defaultTrending }));
    expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
    // score=0.95 -> round(0.95*100) = 95 posts
    expect(screen.getByText(/95 posts/)).toBeInTheDocument();
  });

  it('links trending items to /article/{id}', () => {
    render(React.createElement(RightPanel, { trending: defaultTrending }));
    const trendingLink = screen.getByText('GPT-5 Launch Announced');
    expect(trendingLink.closest('a')).toHaveAttribute('href', '/article/trend-1');
  });

  it('renders "Show more" link to /trending', () => {
    render(React.createElement(RightPanel, { trending: defaultTrending }));
    const showMore = screen.getByText('Show more');
    expect(showMore).toBeInTheDocument();
    expect(showMore.closest('a')).toHaveAttribute('href', '/trending');
  });

  it('limits trending items to 5', () => {
    const manyTrending = Array.from({ length: 7 }, (_, i) => ({
      title: `Trend ${i + 1}`,
      id: `trend-${i}`,
      score: 0.5,
      source_name: 'Source',
    }));
    render(React.createElement(RightPanel, { trending: manyTrending }));
    expect(screen.getByText('Trend 1')).toBeInTheDocument();
    expect(screen.getByText('Trend 5')).toBeInTheDocument();
    expect(screen.queryByText('Trend 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Trend 7')).not.toBeInTheDocument();
  });

  it('renders "Trending Models" widget', () => {
    render(React.createElement(RightPanel));
    expect(screen.getByText('Trending Models')).toBeInTheDocument();
  });

  it('renders nvidia model row', async () => {
    render(React.createElement(RightPanel));
    await waitFor(() => {
      expect(screen.getByText(/nvidia/)).toBeInTheDocument();
    });
    expect(screen.getByText(/LocateAnything/)).toBeInTheDocument();
  });

  it('renders google model row', async () => {
    render(React.createElement(RightPanel));
    await waitFor(() => {
      expect(screen.getByText(/google/)).toBeInTheDocument();
    });
    expect(screen.getByText(/gemma/)).toBeInTheDocument();
  });

  it('renders ideogram model row', async () => {
    render(React.createElement(RightPanel));
    await waitFor(() => {
      expect(screen.getByText(/ideogram/)).toBeInTheDocument();
    });
    expect(screen.getByText(/ideogram-4/)).toBeInTheDocument();
  });

  it('renders "View all models" link', async () => {
    render(React.createElement(RightPanel));
    await waitFor(() => {
      const viewAll = screen.getByText('View all on Hugging Face');
      expect(viewAll).toBeInTheDocument();
      expect(viewAll.closest('a')).toHaveAttribute('href', 'https://huggingface.co/models?sort=trending');
    });
  });

  it('renders custom content when provided', () => {
    const customContent = React.createElement('div', { 'data-testid': 'custom-content' }, 'Custom Widget');
    render(React.createElement(RightPanel, { customContent }));
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Widget')).toBeInTheDocument();
  });

  it('renders CPU icons for model rows', async () => {
    render(React.createElement(RightPanel));
    await waitFor(() => {
      const cpuIcons = screen.getAllByTestId('icon-Cpu');
      expect(cpuIcons.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('maintains sticky positioned aside element', () => {
    render(React.createElement(RightPanel));
    const aside = document.querySelector('aside');
    expect(aside?.className).toContain('sticky');
  });
});
