import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import PWARegister from '@/components/PWARegister';

/**
 * PWARegister — registers the service worker on mount when in production.
 * Should fail gracefully when SW is unavailable or registration errors.
 */

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('PWARegister', () => {
  it('registers service worker on mount when navigator.serviceWorker is available', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const mockRegister = vi.fn().mockResolvedValue({
      scope: '/',
      installing: null,
      addEventListener: vi.fn(),
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
      writable: true,
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<PWARegister />);

    // Wait for the async effect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'PWA Service Worker registered:',
      '/',
    );

    consoleSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('handles missing navigator.serviceWorker gracefully (no crash)', () => {
    vi.stubEnv('NODE_ENV', 'production');

    // Ensure serviceWorker is undefined
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    // Should not throw
    expect(() => render(<PWARegister />)).not.toThrow();

    vi.unstubAllEnvs();
  });

  it('handles registration error gracefully (no crash)', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const mockError = new Error('SW registration failed');
    const mockRegister = vi.fn().mockRejectedValue(mockError);

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
      writable: true,
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<PWARegister />);

    // Wait for the async effect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'PWA Service Worker registration failed:',
      mockError,
    );

    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('does not attempt registration when NODE_ENV is not production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const mockRegister = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      configurable: true,
      writable: true,
    });

    render(<PWARegister />);

    expect(mockRegister).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it('renders null (no visible DOM output)', () => {
    vi.stubEnv('NODE_ENV', 'production');

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue({
          scope: '/',
          installing: null,
          addEventListener: vi.fn(),
        }),
      },
      configurable: true,
      writable: true,
    });

    const { container } = render(<PWARegister />);
    expect(container.innerHTML).toBe('');

    vi.unstubAllEnvs();
  });
});
