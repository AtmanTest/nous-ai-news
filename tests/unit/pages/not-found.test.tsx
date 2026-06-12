import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

/**
 * NotFound — custom 404 page shown for unknown routes.
 * Should display a 404 error code, a descriptive message, and a CTA link back home.
 */

describe('NotFound (404 page)', () => {
  it('renders 404 as the error code', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('heading', { name: /404/i }),
    ).toBeInTheDocument();
  });

  it('renders "Page not found" subtitle', () => {
    render(<NotFound />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders a descriptive message about the page not existing', () => {
    render(<NotFound />);
    expect(
      screen.getByText(/doesn't exist or has been moved/i),
    ).toBeInTheDocument();
  });

  it('renders a "Back to Home" CTA link pointing to the root', () => {
    render(<NotFound />);
    const homeLink = screen.getByRole('link', { name: /back to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders a footer hint with "Error 404"', () => {
    render(<NotFound />);
    expect(
      screen.getByText(/error 404/i),
    ).toBeInTheDocument();
  });

  it('uses an SVG icon for visual indication', () => {
    const { container } = render(<NotFound />);
    // The component renders an SVG inside the icon container
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });
});
