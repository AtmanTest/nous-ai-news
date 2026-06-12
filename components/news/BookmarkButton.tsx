'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  isBookmarked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BookmarkButton({
  isBookmarked = false,
  size = 'sm',
  className,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4.5 w-4.5',
    lg: 'h-5 w-5',
  };

  const toggleBookmark = async () => {
    setBookmarked(!bookmarked);
  };

  return (
    <button
      onClick={toggleBookmark}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        bookmarked
          ? 'text-primary bg-primary/10 hover:bg-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        sizeClasses[size],
        className
      )}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Bookmark
        className={cn(iconSizes[size], bookmarked && 'fill-primary')}
      />
    </button>
  );
}
