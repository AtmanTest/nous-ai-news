import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '@/components/layout/ThemeProvider';

// ── Test consumer component ─────────────────────────────────────────────
function ThemeConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="set-dim" onClick={() => setTheme('dim')}>Dim</button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Light</button>
    </div>
  );
}

function setup({ defaultTheme, storageKey }: { defaultTheme?: 'dark' | 'dim' | 'light'; storageKey?: string } = {}) {
  return render(
    <ThemeProvider defaultTheme={defaultTheme} storageKey={storageKey}>
      <ThemeConsumer />
    </ThemeProvider>
  );
}

describe('ThemeProvider', () => {
  // ── Default theme ──────────────────────────────────────────────────────
  describe('default theme', () => {
    it('has default theme as dark when no defaultTheme prop is provided', () => {
      setup();
      expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    });

    it('accepts a custom defaultTheme prop', () => {
      setup({ defaultTheme: 'light' });
      expect(screen.getByTestId('current-theme').textContent).toBe('light');
    });

    it('accepts dim as defaultTheme', () => {
      setup({ defaultTheme: 'dim' });
      expect(screen.getByTestId('current-theme').textContent).toBe('dim');
    });
  });

  // ── Renders children ───────────────────────────────────────────────────
  describe('children rendering', () => {
    it('renders children content', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );
      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('renders a consumer component that can read the theme', () => {
      setup();
      expect(screen.getByTestId('current-theme')).toBeDefined();
    });
  });

  // ── setTheme ───────────────────────────────────────────────────────────
  describe('setTheme', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.className = '';
    });

    it('changes theme from dark to dim when setTheme is called', () => {
      setup();
      fireEvent.click(screen.getByTestId('set-dim'));
      expect(screen.getByTestId('current-theme').textContent).toBe('dim');
    });

    it('changes theme from dark to light when setTheme is called', () => {
      setup();
      fireEvent.click(screen.getByTestId('set-light'));
      expect(screen.getByTestId('current-theme').textContent).toBe('light');
    });

    it('cycles theme dark→dim→light correctly', () => {
      setup();
      const dimBtn = screen.getByTestId('set-dim');
      const lightBtn = screen.getByTestId('set-light');

      fireEvent.click(dimBtn);
      expect(screen.getByTestId('current-theme').textContent).toBe('dim');

      fireEvent.click(lightBtn);
      expect(screen.getByTestId('current-theme').textContent).toBe('light');
    });
  });

  // ── localStorage ───────────────────────────────────────────────────────
  describe('localStorage integration', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.className = '';
    });

    it('writes theme to localStorage when setTheme is called', () => {
      setup({ storageKey: 'test-theme' });
      fireEvent.click(screen.getByTestId('set-light'));
      expect(localStorage.getItem('test-theme')).toBe('light');
    });

    it('writes dim theme to localStorage', () => {
      setup({ storageKey: 'test-theme' });
      fireEvent.click(screen.getByTestId('set-dim'));
      expect(localStorage.getItem('test-theme')).toBe('dim');
    });

    it('reads theme from localStorage on mount', () => {
      localStorage.setItem('nous-news-theme', 'light');
      setup();
      expect(screen.getByTestId('current-theme').textContent).toBe('light');
    });

    it('uses custom storageKey for reading on mount', () => {
      localStorage.setItem('custom-key', 'dim');
      setup({ storageKey: 'custom-key' });
      expect(screen.getByTestId('current-theme').textContent).toBe('dim');
    });

    it('defaults to defaultTheme when localStorage is empty', () => {
      setup({ defaultTheme: 'dark' });
      expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    });

    it('stored value overrides defaultTheme', () => {
      localStorage.setItem('nous-news-theme', 'light');
      setup({ defaultTheme: 'dark' });
      expect(screen.getByTestId('current-theme').textContent).toBe('light');
    });

    it('uses default storageKey nous-news-theme when none provided', () => {
      setup();
      fireEvent.click(screen.getByTestId('set-dim'));
      expect(localStorage.getItem('nous-news-theme')).toBe('dim');
    });
  });

  // ── Document class ─────────────────────────────────────────────────────
  describe('document.documentElement class', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.className = '';
    });

    it('applies the theme class to document.documentElement on mount', () => {
      setup({ defaultTheme: 'dark' });
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies light class when theme is set to light', () => {
      setup({ defaultTheme: 'dark' });
      fireEvent.click(screen.getByTestId('set-light'));
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('removes old theme class when theme changes', () => {
      setup({ defaultTheme: 'dark' });
      fireEvent.click(screen.getByTestId('set-light'));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('removes all theme classes on change and applies only the new one', () => {
      setup({ defaultTheme: 'dark' });
      fireEvent.click(screen.getByTestId('set-dim'));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.classList.contains('dim')).toBe(true);
    });

    it('applies dim class on mount when defaultTheme is dim', () => {
      setup({ defaultTheme: 'dim' });
      expect(document.documentElement.classList.contains('dim')).toBe(true);
    });

    it('applies light class on mount when defaultTheme is light', () => {
      setup({ defaultTheme: 'light' });
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });

  // ── useTheme returns default state outside provider ───────────────────
  describe('useTheme', () => {
    it('returns default theme when used outside ThemeProvider (context default)', () => {
      // The context is created with initialState as default, so outside
      // ThemeProvider, useTheme returns { theme: 'dark', setTheme: () => null }
      render(<ThemeConsumer />);
      expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    });

    it('setTheme is a no-op when used outside ThemeProvider', () => {
      // The default setTheme is () => null, so clicking should not crash
      render(<ThemeConsumer />);
      // Just verify clicking doesn't throw
      expect(() => {
        fireEvent.click(screen.getByTestId('set-light'));
      }).not.toThrow();
      // Theme stays 'dark' because the default setTheme does nothing
      expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    });
  });
});
