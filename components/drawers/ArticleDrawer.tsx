'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Heart, Bookmark, Share2, MessageCircle, Repeat2, Clock, User } from 'lucide-react';
import { timeAgo, readingTime } from '@/lib/utils';
import { SourceAvatar } from '@/components/ui/SourceAvatar';
import { ShareButtons } from '@/components/sharing/ShareButtons';
import { TagChip } from '@/components/ui/TagChip';

interface ArticleDrawerProps {
  article: {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    image_url?: string | null;
    source_name?: string;
    source_logo?: string;
    category?: string | null;
    tags?: string[];
    published_at?: string;
    url?: string;
  };
  onClose: () => void;
}

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  const [liked, setLiked] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 z-[1000] w-full sm:w-[600px] h-dvh bg-background border-l border-border/40 overflow-y-auto shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center gap-4 px-4 h-[53px]">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-accent/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="font-bold text-[15px]">Article</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Hero image */}
          {article.image_url && (
            <div className="rounded-2xl overflow-hidden border border-border/40 mb-6">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full aspect-[16/9] object-cover"
              />
            </div>
          )}

          {/* Source + meta */}
          <div className="flex items-center gap-3 mb-4">
            <SourceAvatar src={article.source_logo} name={article.source_name} size="lg" />
            <div>
              <p className="font-bold text-[15px]">{article.source_name}</p>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span>{article.published_at ? timeAgo(article.published_at) : ''}</span>
                <span>·</span>
                <span>{readingTime(article.content || article.summary || article.title)} min read</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-extrabold leading-tight mb-4">
            {article.title}
          </h1>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>
          )}

          {/* Summary (if no content) */}
          {!article.content && article.summary && (
            <p className="text-[17px] text-muted-foreground leading-7 mb-6">
              {article.summary}
            </p>
          )}

          {/* Full content */}
          {article.content && (
            <div className="text-[17px] leading-7 space-y-4 mb-8 prose prose-invert max-w-none">
              {article.content.split('\n').map((para, i) => (
                para.trim() ? <p key={i}>{para}</p> : null
              ))}
            </div>
          )}

          {/* Source link */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-border/50 text-[17px] font-bold hover:bg-accent/20 transition-colors mb-6"
            >
              Read original article <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/40 px-4 py-3">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
              <MessageCircle className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-[#00ba7c] transition-colors p-2 rounded-full hover:bg-[rgba(0,186,124,0.1)]">
              <Repeat2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 p-2 rounded-full transition-all ${
                liked ? 'text-[#f91880] bg-[rgba(249,24,128,0.1)]' : 'text-muted-foreground hover:text-[#f91880] hover:bg-[rgba(249,24,128,0.1)]'
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current scale-110' : ''}`} />
            </button>
            <ShareButtons title={article.title} path={`/article/${article.id}`} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
