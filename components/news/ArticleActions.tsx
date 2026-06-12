'use client';

import { Bookmark, Share2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookmarks } from '@/hooks/useBookmarks';

interface ArticleActionsProps {
  articleId: string;
  title: string;
}

export function ArticleActions({ articleId, title }: ArticleActionsProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(articleId);

  return (
    <div className="flex items-center gap-1">
      <a
        href="/"
        className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
        aria-label="Back to Home"
      >
        <ArrowLeft className="h-4 w-4" />
      </a>
      <button
        onClick={() => toggleBookmark(articleId)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          bookmarked
            ? 'text-primary hover:text-primary/80'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        )}
        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-primary')} />
      </button>
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title, url: window.location.href });
          }
        }}
        className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
        aria-label="Share"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}
