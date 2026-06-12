import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  models: 'AI Models',
  research: 'Research',
  business: 'Business',
  policy: 'Policy & Regulation',
  'open-source': 'Open Source',
  hardware: 'Hardware',
  startups: 'Startups',
  general: 'General',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  models: 'The latest AI model releases, benchmarks, and architecture breakthroughs.',
  research: 'Cutting-edge AI research papers, findings, and academic developments.',
  business: 'AI industry news, investments, market trends, and corporate strategies.',
  policy: 'AI regulation, governance, ethics, and policy developments worldwide.',
  'open-source': 'Open source AI projects, releases, tools, and community contributions.',
  hardware: 'AI hardware, chips, GPUs, TPUs, and infrastructure innovations.',
  startups: 'AI startup news, funding rounds, product launches, and ecosystem growth.',
  general: 'General AI news and developments across the landscape.',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const label = CATEGORY_LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${label} — AI News`,
    description: CATEGORY_DESCRIPTIONS[slug] || `Latest AI news in ${label.toLowerCase()}.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const label = CATEGORY_LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const description = CATEGORY_DESCRIPTIONS[slug] || `Latest AI news in ${label.toLowerCase()}.`;

  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, summary, source_name, published_at, category, url')
    .eq('category', slug)
    .eq('status', 'published')
    .gte('published_at', sevenDaysAgo)
    .order('published_at', { ascending: false })
    .limit(50);

  const realArticles = articles || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">{label}</h1>
      <p className="text-muted-foreground mb-8">{description}</p>

      {realArticles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No articles in this category yet.</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
            Articles will appear here once ingested. Try refreshing the news feed from the homepage, or check back after the next cron cycle.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {realArticles.map((article: any) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="block p-4 sm:p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-accent/50 transition-all group"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {label}
                </span>
                {article.source_name && (
                  <>
                    <span className="font-medium text-foreground/70">{article.source_name}</span>
                    <span className="hidden sm:inline">·</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.published_at ? timeAgo(article.published_at) : 'Recently'}
                </span>
              </div>
              <h2 className="font-semibold text-base sm:text-lg mb-1 group-hover:text-primary transition-colors leading-snug">
                {article.title}
              </h2>
              {article.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              )}
              {article.url && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/60">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{article.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
