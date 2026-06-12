import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, ExternalLink, Tag, Globe, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StoryCard } from '@/components/news/StoryCard';
import { Badge } from '@/components/ui/badge';
import { timeAgo, readingTime, safeJsonParse } from '@/lib/utils';
import { jsonLdArticle } from '@/lib/seo/schema';
import { ArticleActions } from '@/components/news/ArticleActions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

interface Article {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  source_name: string;
  category: string | null;
  tags: string[];
  entities: string | null;
  published_at: string;
  url: string;
  language: string | null;
  is_breaking: boolean;
  score: number;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: article } = await supabase
      .from('articles')
      .select('id, title, summary, image_url, source_name, url, published_at')
      .eq('id', slug)
      .single();

    if (article) {
      return {
        title: article.title,
        description: article.summary?.slice(0, 160) || `AI news article from ${article.source_name}`,
        openGraph: {
          type: 'article',
          title: article.title,
          description: article.summary?.slice(0, 160),
          url: article.url,
          images: article.image_url ? [{ url: article.image_url }] : [],
          publishedTime: article.published_at,
          authors: [article.source_name],
        },
        twitter: {
          card: 'summary_large_image',
          title: article.title,
          description: article.summary?.slice(0, 160),
          images: article.image_url ? [article.image_url] : [],
        },
        alternates: { canonical: `/article/${article.id}` },
      };
    }
  } catch {}
  return { title: 'Article | Daily AI', description: 'AI news article from Daily AI' };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  let article: Article | null = null;
  let relatedArticles: Article[] = [];

  try {
    const { data } = await supabase
      .from('articles')
      .select('id, title, summary, content, image_url, source_name, category, tags, entities, published_at, url, language, is_breaking, score')
      .eq('id', slug)
      .single();
    article = data as Article | null;

    if (article) {
      let q = supabase
        .from('articles')
        .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking')
        .neq('id', slug)
        .eq('status', 'published')
        .order('score', { ascending: false })
        .limit(4);
      if (article.category && article.category !== 'general') {
        q = q.eq('category', article.category);
      }
      const { data: related } = await q;
      relatedArticles = (related || []).slice(0, 4) as Article[];
    }
  } catch {}

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground">This article could not be loaded.</p>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">Back to home</Link>
      </div>
    );
  }

  const parsedEntities = safeJsonParse<Array<{ type: string; name: string }>>(article.entities, []);
  const readableCategory = categoryLabel(article.category || 'general');
  const readingMinutes = readingTime(article.content || article.summary || article.title);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdArticle({
            title: article.title,
            description: article.summary || '',
            url: article.url,
            imageUrl: article.image_url || undefined,
            publishedAt: article.published_at,
            author: article.source_name,
            category: article.category || undefined,
          })),
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Home
        </Link>
        <article className="animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary" className="uppercase text-[11px] tracking-wider font-semibold px-2.5 py-0.5">
              {readableCategory}
            </Badge>
            {article.is_breaking && (
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider animate-pulse-soft">Breaking</span>
            )}
            {article.language && article.language !== 'en' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Globe className="h-3 w-3" />{article.language.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">{article.title}</h1>
          {article.summary && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-reading">{article.summary}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border/30">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{article.source_name}</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {article.published_at ? timeAgo(article.published_at) : 'Recently'}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />{readingMinutes} min read
              </span>
              {article.score > 70 && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />Trending
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ArticleActions articleId={article.id} title={article.title} />
            </div>
          </div>
          <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted mb-8">
            {article.image_url ? (
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" loading="eager" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 flex items-center justify-center">
                <div className="text-4xl mb-2 opacity-20">📰</div>
                <span className="text-sm text-muted-foreground">{article.source_name}</span>
              </div>
            )}
          </div>
          <div className="max-w-reading mx-auto">
            <div className="text-foreground leading-relaxed space-y-4">
              {article.content ? (
                article.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="leading-relaxed text-[15px] md:text-base">{paragraph}</p>
                ))
              ) : article.summary ? (
                <p className="text-lg leading-relaxed text-muted-foreground">{article.summary}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Full article content not available in our feed.{' '}
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Read the original article →</a>
                </p>
              )}
            </div>
            <div className="mt-8 mb-12">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all group">
                Read original article
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="mb-10 pb-8 border-b border-border/30">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors">
                      <Tag className="h-3 w-3" />{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {parsedEntities.length > 0 && (
              <div className="mb-10 pb-8 border-b border-border/30">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Mentioned</h3>
                <div className="flex flex-wrap gap-2">
                  {parsedEntities.map((entity) => (
                    <span key={entity.name} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border/50 bg-card">
                      {entity.name}
                      <span className="text-[10px] text-muted-foreground ml-0.5">({entity.type})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
        {relatedArticles.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border/30">
            <h2 className="text-xl font-bold mb-6">Related Stories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedArticles.map((related) => (
                <StoryCard key={related.id} {...related} slug={related.id} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    models: 'AI Models', research: 'Research', business: 'Business', policy: 'Policy & Regulation',
    'open-source': 'Open Source', startups: 'Startups', hardware: 'Hardware', general: 'General',
  };
  return map[slug] || slug;
}
