'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Repeat2, Heart, BarChart3, Bookmark, Share } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagChip } from '@/components/ui/TagChip';
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

  const [imgError, setImgError] = useState(false);

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
        {/* Title directly — no source name */}
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug mb-0.5 line-clamp-2">
            {title}
          </h3>
        </div>

        {/* Image */}
        {image_url && !imgError && (
          <div className="ml-0 mb-3 rounded-2xl overflow-hidden border border-border/40">
            <img
              src={image_url}
              alt={title}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="max-w-[425px]">
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
