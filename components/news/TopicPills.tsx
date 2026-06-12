'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Topic {
  slug: string;
  label: string;
  count?: number;
}

interface TopicPillsProps {
  topics: Topic[];
  active?: string;
  variant?: 'default' | 'scrollable';
}

export function TopicPills({ topics, active, variant = 'scrollable' }: TopicPillsProps) {
  const defaultTopics: Topic[] = [
    { slug: 'all', label: 'All' },
    { slug: 'models', label: 'Models' },
    { slug: 'research', label: 'Research' },
    { slug: 'business', label: 'Business' },
    { slug: 'policy', label: 'Policy' },
    { slug: 'open-source', label: 'Open Source' },
    { slug: 'startups', label: 'Startups' },
    { slug: 'hardware', label: 'Hardware' },
    { slug: 'agents', label: 'Agents' },
    { slug: 'safety', label: 'Safety' },
  ];

  const items = topics.length > 0 ? topics : defaultTopics;

  if (variant === 'scrollable') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 py-2">
          {items.map((topic) => (
            <Link
              key={topic.slug}
              href={topic.slug === 'all' ? '/' : `/topics/${topic.slug}`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                active === topic.slug || (topic.slug === 'all' && !active)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {topic.label}
              {topic.count !== undefined && (
                <span className="text-xs opacity-70">({topic.count})</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((topic) => (
        <Link
          key={topic.slug}
          href={topic.slug === 'all' ? '/' : `/topics/${topic.slug}`}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            active === topic.slug
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          )}
        >
          {topic.label}
        </Link>
      ))}
    </div>
  );
}
