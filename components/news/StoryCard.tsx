'use client';

import Link from 'next/link';
import { Clock, Sparkles, ImageOff, TrendingUp, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo, readingTime } from '@/lib/utils';
import { ShareButtons } from '@/components/sharing/ShareButtons';

export type CardVariant = 'featured' | 'default' | 'compact' | 'list';

interface StoryCardProps {
  id: string;
  slug?: string;
  title: string;
  summary?: string | null;
  image_url?: string | null;
  source_name?: string;
  category?: string | null;
  tags?: string[];
  published_at?: string;
  score?: number;
  is_breaking?: boolean;
  language?: string | null;
  content?: string | null;
  variant?: CardVariant;
  is_featured?: boolean;
  showScore?: boolean;
  className?: string;
  onHideSource?: (source: string) => void;
}

function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    models: 'Models',
    research: 'Research',
    business: 'Business',
    policy: 'Policy',
    'open-source': 'Open Source',
    startups: 'Startups',
    hardware: 'Hardware',
    agents: 'Agents',
    general: 'General',
  };
  return map[slug] || slug;
}

function categoryColor(slug: string): string {
  const colors: Record<string, string> = {
    models: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    research: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    business: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    policy: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'open-source': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    startups: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    hardware: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    agents: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  };
  return colors[slug] || 'bg-muted text-muted-foreground border-border/50';
}

export function StoryCard({
  id,
  slug,
  title,
  summary,
  image_url,
  source_name,
  category,
  tags,
  published_at,
  score,
  is_breaking,
  language,
  content,
  variant = 'default',
  is_featured,
  showScore = true,
  className,
  onHideSource,
}: StoryCardProps) {
  const href = `/article/${slug || id}`;
  const minutes = readingTime(content || summary || title);
  const readableCat = category ? categoryLabel(category) : null;
  const catColor = category ? categoryColor(category) : '';

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className={cn(
          'group block rounded-lg border border-border/40 bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200 overflow-hidden',
          className
        )}
      >
        <div className="flex gap-3 p-3">
          {/* Image thumbnail */}
          <div className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
            {image_url ? (
              <img src={image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                <ImageOff className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {published_at && <span>{timeAgo(published_at)}</span>}
                <span>·</span>
                <span>{minutes}m read</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ShareButtons title={title} path={href} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'list') {
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-start gap-4 py-3 border-b border-border/20 last:border-0 hover:bg-accent/30 px-2 -mx-2 rounded-lg transition-colors',
          className
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {readableCat && (
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded', catColor)}>
                {readableCat}
              </span>
            )}
            {is_breaking && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Breaking</span>
            )}
          </div>
          <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              {source_name && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground/70">
                  {source_name}
                  {onHideSource && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHideSource(source_name); }}
                      className="p-0.5 rounded hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="Hide articles from this source"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    </button>
                  )}
                </span>
              )}
              {published_at && <><span>·</span><span>{timeAgo(published_at)}</span></>}
              <span>·</span>
              <span>{minutes}m read</span>
              {language && language !== 'en' && (
                <>
                  <span>·</span>
                  <Globe className="h-3 w-3" />
                  <span>{language.toUpperCase()}</span>
                </>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ShareButtons title={title} path={href} />
            </div>
          </div>
        </div>
        {image_url && (
          <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted sm:w-20 sm:h-20">
            <img src={image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
      </Link>
    );
  }

  // Default or featured variant
  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-xl border border-border/40 bg-card overflow-hidden transition-all duration-300',
        'hover:border-primary/20 hover:shadow-sm hover:-translate-y-0.5',
        is_featured && 'sm:col-span-2 sm:row-span-2',
        className
      )}
    >
      {/* Image */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        is_featured ? 'aspect-[16/9] sm:aspect-[2/1]' : 'aspect-[16/10]'
      )}>
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading={is_featured ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}

        {/* Overlay gradient for featured */}
        {is_featured && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
          {readableCat && (
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
              is_featured ? 'bg-black/60 text-white' : catColor
            )}>
              {readableCat}
            </span>
          )}
          <div className="flex gap-1 ml-auto">
            {is_breaking && (
              <span className="text-[10px] font-bold text-white bg-red-500/90 px-1.5 py-0.5 rounded">
                Breaking
              </span>
            )}
            {score && score > 70 && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded',
                is_featured ? 'bg-black/60 text-white' : 'bg-primary/10 text-primary'
              )}>
                <TrendingUp className="h-3 w-3" />
                Hot
              </span>
            )}
          </div>
        </div>

        {/* Share overlay */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-border/20">
            <ShareButtons title={title} path={href} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'p-3.5',
        is_featured ? 'p-4 sm:p-5' : ''
      )}>
        {/* Meta row */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
          {source_name && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground/70 truncate">
              {source_name}
              {onHideSource && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHideSource(source_name); }}
                  className="p-0.5 rounded hover:bg-accent text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
                  title="Hide articles from this source"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              )}
            </span>
          )}
          {published_at && (
            <>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-0.5 whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {timeAgo(published_at)}
              </span>
            </>
          )}
          <span className="hidden sm:flex items-center gap-0.5 whitespace-nowrap">
            <Sparkles className="h-3 w-3" />
            {minutes}m
          </span>
          {language && language !== 'en' && (
            <Globe className="h-3 w-3" />
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-semibold leading-snug group-hover:text-primary transition-colors',
          is_featured ? 'text-lg sm:text-xl' : 'text-sm sm:text-base',
        )}>
          {title}
        </h3>

        {/* Summary for featured */}
        {is_featured && summary && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && !is_featured && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-accent/50 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Score bar */}
        {showScore && score && score > 0 && !is_featured && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  score > 80 ? 'bg-primary' : score > 50 ? 'bg-primary/60' : 'bg-primary/30'
                )}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{score}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
