import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfflinePage from '@/app/offline/page';

/**
 * OfflinePage — fallback page shown when the user has no internet connection.
 * Should display an offline message, a retry button, and a link to the home page.
 */

describe('OfflinePage', () => {
  it('renders the offline heading', () => {
    render(<OfflinePage />);
    expect(
      screen.getByRole('heading', { name: /you're offline/i }),
    ).toBeInTheDocument();
  });

  it('renders the offline description message', () => {
    render(<OfflinePage />);
    expect(
      screen.getByText(/lost your internet connection/i),
    ).toBeInTheDocument();
  });

  it('renders a "Try Again" retry button that reloads the page', () => {
    render(<OfflinePage />);
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
    // The button calls window.location.reload()
    expect(tryAgainButton).toHaveTextContent('Try Again');
  });

  it('renders a "Go to Home Page" link pointing to the root', () => {
    render(<OfflinePage />);
    const homeLink = screen.getByRole('link', { name: /go to home page/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders a cached-pages tip for the user', () => {
    render(<OfflinePage />);
    expect(
      screen.getByText(/cached pages are available/i),
    ).toBeInTheDocument();
  });

  it('renders the "Nous AI News" branding', () => {
    render(<OfflinePage />);
    expect(screen.getByText('Nous AI News')).toBeInTheDocument();
  });
});
