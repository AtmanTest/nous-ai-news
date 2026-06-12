'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Repeat2, Heart, BarChart3, Bookmark, Share, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import { TagChip } from '@/components/ui/TagChip';
import { SourceAvatar } from '@/components/ui/SourceAvatar';
import { ShareButtons } from '@/components/sharing/ShareButtons';
import { useBookmarks } from '@/hooks/useBookmarks';

interface NewsCardProps {
  id: string;
  slug?: string;
  title: string;
  summary?: string | null;
  image_url?: string | null;
  source_name?: string;
  source_logo?: string;
  source_handle?: string;
  category?: string | null;
  tags?: string[];
  published_at?: string;
  score?: number;
  is_breaking?: boolean;
  onSourceHide?: (source: string) => void;
}

export function NewsCard({
  id, slug, title, summary, image_url,
  source_name, source_logo, source_handle, category,
  tags, published_at, score, is_breaking,
  onSourceHide,
}: NewsCardProps) {
  const href = `/article/${slug || id}`;
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(score ? Math.round(score * 100) : 0);
  const [showShare, setShowShare] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const bookmarked = isBookmarked(id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikes(l => liked ? l - 1 : l + 1);
  };

  return (
    <Link href={href} className="block group">
      <article className="px-4 py-3 border-b border-border/40 hover:bg-accent/[0.03] transition-colors cursor-pointer">
        {/* Header — Source info */}
        <div className="flex items-start gap-3 mb-1">
          <SourceAvatar src={source_logo} name={source_name} size="md" />
          <div className="flex-1 min-w-0 flex items-center gap-1 text-[15px]">
            <span className="font-bold truncate hover:underline">{source_name}</span>
            {source_handle && (
              <span className="text-muted-foreground truncate">@{source_handle}</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground whitespace-nowrap">
              {published_at ? timeAgo(published_at) : ''}
            </span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Body — Title + Summary */}
        <div className="pl-[52px]">
          <h3 className="text-[15px] font-bold leading-snug mb-0.5 line-clamp-2">
            {title}
          </h3>
          {summary && (
            <p className="text-[15px] text-muted-foreground leading-5 line-clamp-3 mb-3">
              {summary}
            </p>
          )}
        </div>

        {/* Image */}
        {image_url && (
          <div className="ml-[52px] mb-3 rounded-2xl overflow-hidden border border-border/40">
            <img
              src={image_url}
              alt={title}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-[52px] mb-2">
            {tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="ml-[52px] max-w-[425px]">
          <div className="flex items-center justify-between -ml-2">
            {/* Comment */}
            <ActionBtn icon={<MessageCircle className="h-4 w-4" />} count={Math.round((score || 10) * 0.3)} />
            {/* Repost */}
            <ActionBtn icon={<Repeat2 className="h-4 w-4" />} count={Math.round((score || 10) * 0.5)} />
            {/* Like */}
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-[13px] rounded-full px-2 py-1 transition-all',
                liked
                  ? 'text-[#f91880] bg-[rgba(249,24,128,0.1)]'
                  : 'text-muted-foreground hover:text-[#f91880] hover:bg-[rgba(249,24,128,0.1)]'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current scale-110')} />
              <span>{likes > 999 ? `${(likes / 1000).toFixed(1)}K` : likes}</span>
            </button>
            {/* Views */}
            <ActionBtn icon={<BarChart3 className="h-4 w-4" />} count={(score || 10) * 50 > 999 ? `${((score || 10) * 50 / 1000).toFixed(1)}K` : (score || 10) * 50} />
            {/* Bookmark */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(id); }}
              className={cn(
                'flex items-center gap-1.5 text-[13px] rounded-full px-2 py-1 transition-all',
                bookmarked
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              )}
            >
              <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-primary')} />
            </button>
            {/* Share */}
            <div className="relative">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShare(!showShare); }}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-2 py-1 transition-all"
              >
                <Share className="h-4 w-4" />
              </button>
              {showShare && (
                <div className="absolute bottom-full left-0 mb-2 z-50" onClick={(e) => e.stopPropagation()}>
                  <ShareButtons title={title} path={href} />
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function ActionBtn({ icon, count }: { icon: React.ReactNode; count?: number | string }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-2 py-1 transition-all"
    >
      {icon}
      {count !== undefined && <span>{count}</span>}
    </button>
  );
}
