import Link from 'next/link';
import { TrendingUp, Hash, Newspaper, ExternalLink, Sparkles, Zap, Brain, Cpu, Image, Palette, BookOpen } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { TopicPills } from '@/components/news/TopicPills';
import { Badge } from '@/components/ui/badge';
import { timeAgo, readingTime } from '@/lib/utils';
import { LiveUpdateBar } from '@/components/news/LiveUpdateBar';
import { RefreshButton } from '@/components/news/RefreshButton';
import { FilteredFeed } from '@/components/news/FilteredFeed';

const PAGE_SIZE = 12;

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  category: string | null;
  tags: string[];
  published_at: string;
  score: number;
  is_breaking: boolean;
  content: string | null;
  language: string | null;
}

// AI-relevant categories — EXCLUDE noise categories (general, community, media)
const AI_CATEGORIES = [
  'models', 'research', 'business', 'policy', 'hardware', 'agents',
  'open-source', 'startups', 'safety', 'ethics', 'applications',
];

// Sources to explicitly exclude (noisy, non-news, or low-signal)
const EXCLUDED_SOURCES = [
  'Hacker News',
  'Product Hunt AI',
  'Springer AI Research', // academic papers, not news
];

const EXCLUDED_CATEGORIES = [
  'general',
  'community',
  'media',
];

async function getArticles() {
  try {
    const supabase = await createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Base query: AI categories only, exclude noise sources/categories
    const baseQuery = supabase
      .from('articles')
      .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
      .eq('status', 'published')
      .gte('published_at', sevenDaysAgo)
      .in('category', AI_CATEGORIES)
      .filter('source_name', 'not.in', `(${EXCLUDED_SOURCES.join(',')})`);

    // Get articles with images for hero/featured
    const { data: featured } = await baseQuery
      .not('image_url', 'is', null)
      .order('score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(5);

    // Get trending (high score, recent) - higher threshold for quality
    const { data: trending } = await baseQuery
      .gte('score', 40)
      .order('score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(10);

    // Get latest
    const { data: latest } = await baseQuery
      .order('published_at', { ascending: false })
      .limit(PAGE_SIZE);

    return {
      featured: (featured || []) as Article[],
      trending: (trending || []) as Article[],
      latest: (latest || []) as Article[],
    };
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    return { featured: [], trending: [], latest: [] };
  }
}

function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    models: 'AI Models',
    research: 'Research',
    business: 'Business',
    policy: 'Policy',
    'open-source': 'Open Source',
    startups: 'Startups',
    hardware: 'Hardware',
    agents: 'Agents',
  };
  return map[slug] || slug;
}

export default async function HomePage() {
  let featured: Article[] = [];
  let trending: Article[] = [];
  let latest: Article[] = [];
  try {
    const data = await getArticles();
    featured = data.featured;
    trending = data.trending;
    latest = data.latest;
  } catch (err) {
    console.error('Fatal error in HomePage:', err);
  }
  const hasTrending = trending.length > 2;

  // Show top 4 by score for hero
  const heroStories = featured.length >= 3 ? featured.slice(0, 4) : latest.slice(0, 4);
  const mainHero = heroStories[0];
  const sideHeroes = heroStories.slice(1, 4);

  return (
    <div className="animate-fade-in">
      <LiveUpdateBar initialTimestamp={latest[0]?.published_at || new Date().toISOString()} />
      {/* ═══════════════════════════════════════
         AI FEATURES — Auto Evolve + DeepMind (TOP OF PAGE)
         ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Auto Evolve Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/20 p-5 sm:p-6 flex flex-col">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-20" />
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Auto Evolve</h2>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Self-improving AI platform — tests, fixes, and ships autonomously while you sleep</p>
                  </div>
                </div>
                <div className="w-full sm:w-auto">
                  <Link
                    href="/auto-tune"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    View Engine
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5 pt-4 border-t border-border/20">
                <div className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Continuous CI/CD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs text-muted-foreground">LLM-Driven Bug Fixes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs text-muted-foreground">Auto Test Generation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs text-muted-foreground">Weekly Feature Planning</span>
                </div>
              </div>
            </div>

            {/* DeepMind Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-rose-500/5 border border-pink-500/20 p-5 sm:p-6 flex flex-col">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-20" />
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-rose-500 flex items-center justify-center shrink-0">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">DeepMind</h2>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">AI philosopher reads world news (20min, BBC, Google) & writes luminous essays on humanity's future</p>
                  </div>
                </div>
                <div className="w-full sm:w-auto">
                  <Link
                    href="/ia-auto-news"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:from-pink-600 hover:to-rose-600 transition-all w-full sm:w-auto"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    Read Essays
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5 pt-4 border-t border-border/20">
                <div className="flex items-center gap-1.5 col-span-1">
                  <Image className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">20 Minutes + BBC + Google</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-pink-400" />
                  <span className="text-xs text-muted-foreground">2-3 essays daily</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs text-muted-foreground">DALL·E 3 images</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         HERO SECTION
         ═══════════════════════════════════════ */}
      {mainHero && (
        <section className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main hero — spans 2 cols */}
              <div className="lg:col-span-2">
                <Link
                  href={`/article/${mainHero.id}`}
                  className="group block relative rounded-xl overflow-hidden bg-card border border-border/40 h-full min-h-[320px] sm:min-h-[420px]"
                >
                  {/* Background image */}
                  <div className="absolute inset-0 bg-muted">
                    {mainHero.image_url ? (
                      <img
                        src={mainHero.image_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </div>

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      {mainHero.category && (
                        <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] uppercase tracking-wider">
                          {categoryLabel(mainHero.category)}
                        </Badge>
                      )}
                      {mainHero.is_breaking && (
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse-soft">
                          Breaking
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                      {mainHero.title}
                    </h1>
                    {mainHero.summary && (
                      <p className="text-sm text-white/70 line-clamp-2 max-w-2xl hidden sm:block">
                        {mainHero.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-white/50">
                      <span className="font-medium text-white/70">{mainHero.source_name}</span>
                      <span>·</span>
                      <span>{mainHero.published_at ? timeAgo(mainHero.published_at) : ''}</span>
                      <span>·</span>
                      <span>{readingTime(mainHero.content || mainHero.summary || mainHero.title)} min read</span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Side stories */}
              <div className="flex flex-col gap-4">
                {sideHeroes.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="group relative flex-1 rounded-xl overflow-hidden bg-card border border-border/40 min-h-[140px] sm:min-h-[180px]"
                  >
                    <div className="absolute inset-0 bg-muted">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {article.category && (
                          <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                            {categoryLabel(article.category)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
                        {article.title}
                      </h3>
                      <div className="text-[10px] text-white/50 mt-1">
                        {article.source_name} · {article.published_at ? timeAgo(article.published_at) : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
         TRENDING TICKER (below hero, full width)
         ═══════════════════════════════════════ */}
      {hasTrending && (
        <section className="border-y border-border/30 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Trending Now</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {trending.slice(0, 8).map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="shrink-0 group flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/40 hover:border-primary/30 transition-colors text-xs"
                >
                  {article.image_url ? (
                    <img src={article.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px]">AI</span>
                  )}
                  <span className="font-medium text-foreground/80 group-hover:text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                    {article.title}
                  </span>
                  {article.score && article.score > 70 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {article.score}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
         MAIN CONTENT — Latest feed
         ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Feed column */}
          <div className="lg:col-span-3">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Latest AI News</h2>
              </div>
              <div className="flex items-center gap-1">
                <RefreshButton />
              </div>
              <Link
                href="/trending"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                View all <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Featured grid — top 4 stories with images */}
            <FilteredFeed featured={featured} latest={[]} excludeIds={heroStories.slice(0, 4).map(a => a.id)} />

            {/* Latest feed with load more */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Latest</h3>
              </div>
              <FilteredFeed featured={[]} latest={latest} excludeIds={heroStories.slice(0, 4).map(a => a.id)} showEmptyMessage={false} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-8">
              {/* Top Stories widget - PROMINENT, FIRST */}
              {trending.length > 0 && (
                <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Top Stories</h3>
                  </div>
                  <div className="space-y-3">
                    {trending.slice(0, 6).map((article, i) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.id}`}
                        className="group flex items-start gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
                      >
                        <span className="text-base font-bold text-primary/60 shrink-0 w-7 leading-none">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            <span className="font-medium">{article.source_name}</span>
                            <span>·</span>
                            <span>{article.published_at ? timeAgo(article.published_at) : ''}</span>
                            {article.score && article.score > 50 && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                                {article.score}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics widget - SECOND */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Topics</h3>
                </div>
                <TopicPills topics={[]} />
              </div>

              {/* Source freshness note */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-[11px] text-muted-foreground">
                  Data updated daily at 07:00 UTC via automated ingestion from 20+ AI news sources including OpenAI, Anthropic, Google DeepMind, Hugging Face, and more.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
