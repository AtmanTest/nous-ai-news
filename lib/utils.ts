import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  // Parse the date and ensure we're comparing in UTC to avoid timezone issues
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();

  // If the date is in the future (due to timezone differences), show "just now"
  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function readingTime(text: string): number {
  if (!text) return 1;
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    models: 'AI Models',
    research: 'Research',
    business: 'Business',
    policy: 'Policy & Regulation',
    'open-source': 'Open Source',
    startups: 'Startups',
    hardware: 'Hardware',
    agents: 'AI Agents',
    general: 'General',
  };
  return map[slug] || slug;
}

export function safeJsonParse<T>(data: string | null | undefined, fallback: T): T {
  if (!data) return fallback;
  try { return JSON.parse(data) as T; }
  catch { return fallback; }
}