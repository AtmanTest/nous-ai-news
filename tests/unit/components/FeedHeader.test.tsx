import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedHeader } from '@/components/feed/FeedHeader';

const TABS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Trending', value: 'trending' },
  { label: 'For You', value: 'for-you' },
];

describe('FeedHeader', () => {
  it('renders title', () => {
    render(
      <FeedHeader title="Latest" tabs={TABS} activeTab="latest" onTabChange={() => {}} />
    );
    expect(screen.getByRole('heading', { name: 'Latest' })).toBeDefined();
  });

  it('renders all tabs', () => {
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="latest" onTabChange={() => {}} />
    );
    // Title heading
    expect(screen.getByRole('heading', { name: 'Feed' })).toBeDefined();
    // Tab buttons — getByText works here because the title has a different role
    const tabButtons = screen.getAllByRole('button');
    expect(tabButtons.length).toBe(3);
  });

  it('highlights the active tab', () => {
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="trending" onTabChange={() => {}} />
    );
    const trendingBtn = screen.getByText('Trending');
    expect(trendingBtn.className).toContain('font-bold');
  });

  it('does not highlight inactive tabs', () => {
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="latest" onTabChange={() => {}} />
    );
    const trendingBtn = screen.getByText('Trending');
    const forYouBtn = screen.getByText('For You');
    expect(trendingBtn.className).toContain('text-muted-foreground');
    expect(forYouBtn.className).toContain('text-muted-foreground');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="latest" onTabChange={onTabChange} />
    );
    fireEvent.click(screen.getByText('Trending'));
    expect(onTabChange).toHaveBeenCalledWith('trending');
  });

  it('shows back button when showBack is true', () => {
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="latest" onTabChange={() => {}} showBack />
    );
    const backBtn = document.querySelector('button svg path');
    expect(backBtn).not.toBeNull();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="latest" onTabChange={() => {}} showBack onBack={onBack} />
    );
    const svg = document.querySelector('button svg');
    fireEvent.click(svg!.closest('button')!);
    expect(onBack).toHaveBeenCalled();
  });

  it('shows settings link when showSettings is true', () => {
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="latest" onTabChange={() => {}} showSettings />
    );
    const settingsLinks = screen.getAllByRole('link');
    const settingsLink = settingsLinks.find(l => l.getAttribute('href') === '/settings');
    expect(settingsLink).toBeDefined();
  });

  it('shows search link', () => {
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="latest" onTabChange={() => {}} />
    );
    const searchLinks = screen.getAllByRole('link');
    const searchLink = searchLinks.find(l => l.getAttribute('href') === '/search');
    expect(searchLink).toBeDefined();
  });

  it('renders without tabs when tabs prop is not provided', () => {
    render(
      <FeedHeader title="No Tabs" />
    );
    expect(screen.getByText('No Tabs')).toBeDefined();
    // No tab buttons should exist
    expect(screen.queryByRole('button', { name: /latest/i })).toBeNull();
  });

  it('shows active indicator bar on active tab', () => {
    render(
      <FeedHeader title="Feed" tabs={TABS} activeTab="for-you" onTabChange={() => {}} />
    );
    const forYouBtn = screen.getByText('For You');
    const parentDiv = forYouBtn.closest('button');
    const indicator = parentDiv?.querySelector('span');
    expect(indicator).not.toBeNull();
    expect(indicator?.className).toContain('bg-primary');
  });
});
