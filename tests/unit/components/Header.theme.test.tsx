import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Header } from '@/components/layout/Header';

// ── Mock useTheme ───────────────────────────────────────────────────────
const mockSetTheme = vi.fn();
let mockTheme: 'dark' | 'dim' | 'light' = 'dark';

vi.mock('@/components/layout/ThemeProvider', () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Lucide icons are already auto-mocked by vitest to be simple svg elements
// but we add a data-testid to identify them for the icon checks
vi.mock('lucide-react', () => {
  const iconMock = (name: string) =>
    function MockIcon(props: React.SVGProps<SVGSVGElement>) {
      return <svg data-testid={`icon-${name.toLowerCase()}`} {...props} />;
    };
  return {
    Sun: iconMock('Sun'),
    Moon: iconMock('Moon'),
    Sunset: iconMock('Sunset'),
    Search: iconMock('Search'),
    Settings: iconMock('Settings'),
    Languages: iconMock('Languages'),
  };
});

describe('Header theme toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'dark';
  });

  // ── Renders theme toggle button ───────────────────────────────────────
  describe('renders', () => {
    it('renders the theme toggle button', () => {
      render(<Header />);
      const buttons = screen.getAllByRole('button');
      // The theme toggle is identifiable by its aria-label
      const toggleBtn = buttons.find(
        b => b.getAttribute('aria-label') === 'Switch to dim theme'
      );
      expect(toggleBtn).toBeDefined();
    });

    it('renders the search link with correct href', () => {
      render(<Header />);
      const links = screen.getAllByRole('link');
      const searchLink = links.find(l => l.getAttribute('href') === '/search');
      expect(searchLink).toBeDefined();
    });

    it('renders the settings link with correct href', () => {
      render(<Header />);
      const links = screen.getAllByRole('link');
      const settingsLink = links.find(l => l.getAttribute('href') === '/settings');
      expect(settingsLink).toBeDefined();
    });
  });

  // ── Correct icon per theme ────────────────────────────────────────────
  describe('icon per theme', () => {
    it('shows Sun icon when theme is dark (toggle to dim → sunset)', () => {
      mockTheme = 'dark';
      render(<Header />);
      expect(screen.getByTestId('icon-sun')).toBeDefined();
      expect(screen.queryByTestId('icon-sunset')).toBeNull();
      expect(screen.queryByTestId('icon-moon')).toBeNull();
    });

    it('shows Sunset icon when theme is dim', () => {
      mockTheme = 'dim';
      render(<Header />);
      expect(screen.getByTestId('icon-sunset')).toBeDefined();
      expect(screen.queryByTestId('icon-sun')).toBeNull();
      expect(screen.queryByTestId('icon-moon')).toBeNull();
    });

    it('shows Moon icon when theme is light', () => {
      mockTheme = 'light';
      render(<Header />);
      expect(screen.getByTestId('icon-moon')).toBeDefined();
      expect(screen.queryByTestId('icon-sun')).toBeNull();
      expect(screen.queryByTestId('icon-sunset')).toBeNull();
    });

    it('shows correct aria-label reflecting the next theme in cycle', () => {
      mockTheme = 'dark';
      render(<Header />);
      expect(
        screen.getByLabelText('Switch to dim theme')
      ).toBeDefined();
    });

    it('shows aria-label for dim→light transition', () => {
      mockTheme = 'dim';
      render(<Header />);
      expect(
        screen.getByLabelText('Switch to light theme')
      ).toBeDefined();
    });

    it('shows aria-label for light→dark transition', () => {
      mockTheme = 'light';
      render(<Header />);
      expect(
        screen.getByLabelText('Switch to dark theme')
      ).toBeDefined();
    });
  });

  // ── Theme cycling ──────────────────────────────────────────────────────
  describe('theme cycling', () => {
    it('calls setTheme with "dim" when clicked on dark theme', () => {
      mockTheme = 'dark';
      render(<Header />);
      const toggleBtn = screen.getByLabelText('Switch to dim theme');
      fireEvent.click(toggleBtn);
      expect(mockSetTheme).toHaveBeenCalledWith('dim');
    });

    it('calls setTheme with "light" when clicked on dim theme', () => {
      mockTheme = 'dim';
      render(<Header />);
      const toggleBtn = screen.getByLabelText('Switch to light theme');
      fireEvent.click(toggleBtn);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('calls setTheme with "dark" when clicked on light theme', () => {
      mockTheme = 'light';
      render(<Header />);
      const toggleBtn = screen.getByLabelText('Switch to dark theme');
      fireEvent.click(toggleBtn);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('cycles correctly through all three states', () => {
      // Test dark → dim
      mockTheme = 'dark';
      const { rerender } = render(<Header />);
      fireEvent.click(screen.getByLabelText('Switch to dim theme'));
      expect(mockSetTheme).toHaveBeenCalledWith('dim');

      // Mock that theme changed to dim
      mockTheme = 'dim';
      rerender(<Header />);
      fireEvent.click(screen.getByLabelText('Switch to light theme'));
      expect(mockSetTheme).toHaveBeenCalledWith('light');

      // Mock that theme changed to light
      mockTheme = 'light';
      rerender(<Header />);
      fireEvent.click(screen.getByLabelText('Switch to dark theme'));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('calls setTheme exactly once per click', () => {
      mockTheme = 'dark';
      render(<Header />);
      const toggleBtn = screen.getByLabelText('Switch to dim theme');
      fireEvent.click(toggleBtn);
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });
  });
});
