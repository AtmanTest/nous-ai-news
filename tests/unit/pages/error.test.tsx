import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '@/app/error';

/**
 * ErrorPage — client error boundary shown when a page crashes with an error.
 * Receives error (with optional digest) and reset() as props.
 * Should display a 500 message, optional error digest, and a "Try Again" button.
 */

describe('ErrorPage (500 error boundary)', () => {
  it('renders 500 as the error code', () => {
    const mockReset = vi.fn();
    const error = new Error('Test error');

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(
      screen.getByRole('heading', { name: /500/i }),
    ).toBeInTheDocument();
  });

  it('renders "Something went wrong" subtitle', () => {
    const mockReset = vi.fn();
    const error = new Error('Test error');

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a descriptive error message', () => {
    const mockReset = vi.fn();
    const error = new Error('Test error');

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(
      screen.getByText(/unexpected error occurred/i),
    ).toBeInTheDocument();
  });

  it('renders the error digest when provided', () => {
    const mockReset = vi.fn();
    const error = Object.assign(new Error('Test error'), { digest: 'abc123' });

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(screen.getByText(/error digest: abc123/i)).toBeInTheDocument();
  });

  it('does not render error digest when not provided', () => {
    const mockReset = vi.fn();
    const error = new Error('Test error');

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(screen.queryByText(/error digest/i)).not.toBeInTheDocument();
  });

  it('renders a "Try Again" button that calls reset() on click', () => {
    const mockReset = vi.fn();
    const error = new Error('Test error');

    render(<ErrorPage error={error} reset={mockReset} />);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();

    fireEvent.click(tryAgainButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders a footer hint with "Error 500"', () => {
    const mockReset = vi.fn();
    const error = new Error('Test error');

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(
      screen.getByText(/error 500/i),
    ).toBeInTheDocument();
  });

  it('logs the error to console on mount', () => {
    const mockReset = vi.fn();
    const error = new Error('Test error');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Page error:', error);

    consoleErrorSpy.mockRestore();
  });
});
