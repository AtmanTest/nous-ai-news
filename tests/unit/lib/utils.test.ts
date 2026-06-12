import { describe, it, expect } from 'vitest';
import { timeAgo, readingTime, safeJsonParse, cn, truncate, formatDate, categoryLabel } from '@/lib/utils';

// ─── timeAgo ──────────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  it('returns "Xs ago" for dates less than 60 seconds ago', () => {
    const now = new Date();
    const fiveSecsAgo = new Date(now.getTime() - 5_000);
    expect(timeAgo(fiveSecsAgo)).toBe('5s ago');
  });

  it('returns "Xm ago" for dates between 1 and 59 minutes ago', () => {
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60_000);
    expect(timeAgo(fiveMinsAgo)).toBe('5m ago');
  });

  it('returns "Xh ago" for dates between 1 and 23 hours ago', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 3_600_000);
    expect(timeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Xd ago" for dates between 1 and 6 days ago', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000);
    expect(timeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('returns a formatted date for dates 7+ days ago', () => {
    const oldDate = new Date('2024-01-15');
    const result = timeAgo(oldDate);
    // Should be a formatted date like "Jan 15, 2024"
    expect(result).toMatch(/Jan \d{1,2}, 2024/);
  });

  it('handles string date inputs', () => {
    const dateStr = new Date(Date.now() - 30_000).toISOString();
    const result = timeAgo(dateStr);
    expect(result).toMatch(/^\d+s ago$/);
  });

  it('returns "0s ago" for the current time', () => {
    expect(timeAgo(new Date())).toBe('0s ago');
  });
});

// ─── readingTime ──────────────────────────────────────────────────────────────

describe('readingTime', () => {
  it('returns 1 for empty text', () => {
    expect(readingTime('')).toBe(1);
  });

  it('returns 1 for text under ~200 words', () => {
    const text = 'word '.repeat(100).trim();
    expect(readingTime(text)).toBe(1);
  });

  it('returns 2 for ~400 words', () => {
    const text = 'word '.repeat(400).trim();
    expect(readingTime(text)).toBe(2);
  });

  it('returns correct rounded-up value', () => {
    // 201 words → ceil(201/200) = 2
    const text = 'word '.repeat(201).trim();
    expect(readingTime(text)).toBe(2);
  });

  it('handles null/undefined gracefully', () => {
    expect(readingTime('')).toBe(1);
  });

  it('handles text with multiple spaces and newlines', () => {
    const text = 'word word word\n\nword word  word';
    expect(readingTime(text)).toBe(1);
  });
});

// ─── safeJsonParse ────────────────────────────────────────────────────────────

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', {})).toEqual({});
  });

  it('returns fallback for null input', () => {
    expect(safeJsonParse(null, [])).toEqual([]);
  });

  it('returns fallback for undefined input', () => {
    expect(safeJsonParse(undefined, 42)).toBe(42);
  });

  it('parses array JSON', () => {
    expect(safeJsonParse<number[]>('[1,2,3]', [])).toEqual([1, 2, 3]);
  });

  it('returns fallback for empty string', () => {
    expect(safeJsonParse('', 'default')).toBe('default');
  });
});

// ─── cn (tailwind-merge + clsx) ───────────────────────────────────────────────

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes via clsx', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toBe('base visible');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

// ─── truncate ─────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns text as-is when within maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and appends ellipsis', () => {
    // slice(0,10) of 'hello world this is long' = 'hello worl'
    expect(truncate('hello world this is long', 10)).toBe('hello worl...');
  });

  it('returns empty string for falsy text', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('trims trailing whitespace before ellipsis', () => {
    // slice(0,8) of 'hello world    ' = 'hello wo'
    const result = truncate('hello world    ', 8);
    expect(result).toBe('hello wo...');
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date('2024-03-15');
    expect(formatDate(d)).toMatch(/Mar \d{1,2}, 2024/);
  });

  it('formats an ISO string', () => {
    expect(formatDate('2024-06-01')).toMatch(/Jun \d{1,2}, 2024/);
  });
});

// ─── categoryLabel ────────────────────────────────────────────────────────────

describe('categoryLabel', () => {
  it('maps known slugs to labels', () => {
    expect(categoryLabel('models')).toBe('AI Models');
    expect(categoryLabel('research')).toBe('Research');
    expect(categoryLabel('business')).toBe('Business');
    expect(categoryLabel('policy')).toBe('Policy & Regulation');
    expect(categoryLabel('open-source')).toBe('Open Source');
    expect(categoryLabel('startups')).toBe('Startups');
    expect(categoryLabel('hardware')).toBe('Hardware');
    expect(categoryLabel('agents')).toBe('AI Agents');
    expect(categoryLabel('general')).toBe('General');
  });

  it('returns the slug as-is for unknown categories', () => {
    expect(categoryLabel('unknown-category')).toBe('unknown-category');
  });
});
