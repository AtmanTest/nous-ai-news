import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '@/app/global-error';

/**
 * GlobalError — global error boundary that renders its own <html> and <body>.
 * Receives error (with optional digest) and reset() as props.
 * Should display a critical error message and a "Try Again" button.
 */

describe('GlobalError', () => {
  it('renders 500 as the error code', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');

    render(<GlobalError error={error} reset={mockReset} />);

    expect(
      screen.getByRole('heading', { name: /500/i }),
    ).toBeInTheDocument();
  });

  it('renders "Critical system error" subtitle', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');

    render(<GlobalError error={error} reset={mockReset} />);

    expect(screen.getByText('Critical system error')).toBeInTheDocument();
  });

  it('renders a descriptive message about the critical error', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');

    render(<GlobalError error={error} reset={mockReset} />);

    expect(
      screen.getByText(/critical error occurred/i),
    ).toBeInTheDocument();
  });

  it('renders a "Try Again" button that calls reset() on click', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');

    render(<GlobalError error={error} reset={mockReset} />);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();

    fireEvent.click(tryAgainButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders a footer hint with "Error 500"', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');

    render(<GlobalError error={error} reset={mockReset} />);

    expect(
      screen.getByText(/error 500/i),
    ).toBeInTheDocument();
  });

  it('logs the error to console on mount', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<GlobalError error={error} reset={mockReset} />);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Global error:', error);

    consoleErrorSpy.mockRestore();
  });

  it('renders its own <html> and <body> elements', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');

    const { container } = render(<GlobalError error={error} reset={mockReset} />);

    // The component wraps output in <html> and <body> tags
    const htmlEl = container.querySelector('html');
    const bodyEl = container.querySelector('body');
    expect(htmlEl).toBeInTheDocument();
    expect(bodyEl).toBeInTheDocument();
  });

  it('uses inline styles with a dark background (#000)', () => {
    const mockReset = vi.fn();
    const error = new Error('Critical failure');

    const { container } = render(<GlobalError error={error} reset={mockReset} />);

    // The outer div should have a black background
    const outerDiv = container.querySelector('[style*="background"]');
    expect(outerDiv).toBeInTheDocument();
    expect(outerDiv?.getAttribute('style')).toContain('background-color: rgb(0, 0, 0)');
  });
});
