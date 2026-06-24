import { Metadata } from 'next';
import { Search as SearchIcon, SlidersHorizontal, Clock, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { StoryCard } from '@/components/news/StoryCard';
import { KeywordFilter } from '@/components/news/KeywordFilter';
import { extractArticleKeywords } from '@/lib/content/keywords';

export const metadata: Metadata = {
  title: 'Search AI News',
  description: 'Search through thousands of AI news articles, topics, and sources.',
};

interface Props {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; keywords?: string }>;
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'models', label: 'Models' },
  { value: 'research', label: 'Research' },
  { value: 'business', label: 'Business' },
  { value: 'policy', label: 'Policy' },
  { value: 'open-source', label: 'Open Source' },
  { value: 'startups', label: 'Startups' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'agents', label: 'Agents' },
];

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

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || '';
  const categoryFilter = params.category || '';
  const sort = params.sort || 'relevance';
  const activeKeywords = params.keywords ? params.keywords.split(',').filter(Boolean).map(k => k.toLowerCase().trim()) : [];

  let articles: Article[] = [];
  let totalCount = 0;
  let allKeywords: string[] = [];

  try {
    const supabase = await createAdminClient();

    // Build the query
    let dbQuery = supabase
      .from('articles')
      .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language', { count: 'exact' })
      .eq('status', 'published');

    // Category filter
    if (categoryFilter) {
      dbQuery = dbQuery.eq('category', categoryFilter);
    }

    // Keyword filters (tags array contains) — OR logic
    if (activeKeywords.length > 0) {
      const orConditions = activeKeywords.map(kw => `tags.cs.{${kw}}`).join(',');
      dbQuery = dbQuery.or(orConditions);
    }

    // Text search
    if (query) {
      dbQuery = dbQuery.textSearch('title', query, { type: 'websearch' });
    }

    // Sort
    if (sort === 'latest') {
      dbQuery = dbQuery.order('published_at', { ascending: false });
    } else if (sort === 'trending') {
      dbQuery = dbQuery.order('score', { ascending: false });
    } else {
      dbQuery = dbQuery.order('score', { ascending: false }).order('published_at', { ascending: false });
    }

    const { data, count } = await dbQuery.limit(50);
    articles = (data || []) as Article[];
    totalCount = count || 0;

    // ILIKE fallback for text search
    if (articles.length === 0 && query && activeKeywords.length === 0 && !categoryFilter) {
      const { data: fallback } = await supabase
        .from('articles')
        .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
        .eq('status', 'published')
        .ilike('title', `%${query}%`)
        .order('score', { ascending: false })
        .limit(50);

      articles = (fallback || []) as Article[];
      totalCount = articles.length;
    }

    if (articles.length === 0 && query && !activeKeywords.length) {
      const { data: broader } = await supabase
        .from('articles')
        .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .order('score', { ascending: false })
        .limit(50);

      articles = (broader || []) as Article[];
      totalCount = articles.length;
    }

    // Fetch popular keywords from recent articles
    const { data: recentForKeywords } = await supabase
      .from('articles')
      .select('title, summary, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(200);

    if (recentForKeywords && recentForKeywords.length > 0) {
      const seen = new Set<string>();
      for (const a of recentForKeywords) {
        const kws = extractArticleKeywords(a.title, a.summary, a.tags);
        for (const kw of kws) {
          seen.add(kw);
        }
      }
      // Sort by frequency
      const freq = new Map<string, number>();
      for (const a of recentForKeywords) {
        const kws = extractArticleKeywords(a.title, a.summary, a.tags);
        for (const kw of kws) {
          freq.set(kw, (freq.get(kw) || 0) + 1);
        }
      }
      allKeywords = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 60)
        .map(([kw]) => kw);

      // Remove keywords already matching active filters
      if (activeKeywords.length > 0) {
        allKeywords = allKeywords.filter(kw => !activeKeywords.includes(kw));
      }
    }
  } catch (err) {
    console.error('Search failed:', err);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Search AI News</h1>
        <p className="text-sm text-muted-foreground">
          Search across thousands of articles from 20+ AI news sources
        </p>
      </div>

      {/* Search form */}
      <form
        action="/search"
        method="GET"
        className="mb-4"
      >
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search articles, topics, keywords..."
            className="w-full pl-12 pr-24 py-3.5 rounded-xl border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>

        {/* Pass through hidden inputs for current filters */}
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        {activeKeywords.length > 0 && <input type="hidden" name="keywords" value={activeKeywords.join(',')} />}
      </form>

      {/* Active filter bar */}
      {(query || categoryFilter || activeKeywords.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {categoryFilter && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {CATEGORIES.find(c => c.value === categoryFilter)?.label || categoryFilter}
              <a href={`/search?q=${encodeURIComponent(query)}${activeKeywords.length ? `&keywords=${activeKeywords.join(',')}` : ''}`} className="hover:text-primary/70">&times;</a>
            </span>
          )}
          {activeKeywords.map(kw => (
            <span key={kw} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {kw}
              <a href={`/search?q=${encodeURIComponent(query)}&category=${categoryFilter}&keywords=${activeKeywords.filter(k => k !== kw).join(',')}`} className="hover:text-primary/70">&times;</a>
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            {totalCount > 0 ? `${totalCount} result${totalCount !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
      )}

      {/* Keyword filter panel */}
      {/* This form triggers a GET search with keywords param */}
      <div className="mb-6 p-4 rounded-xl border border-border/30 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keywords</span>
        </div>
        <KeywordFilter
          keywords={allKeywords}
          activeKeywords={activeKeywords}
          maxDisplay={30}
        />
      </div>

      {/* Sort tabs */}
      {articles.length > 0 && (
        <div className="flex items-center gap-1 mb-6 border-b border-border/30 pb-3">
          <SortTab
            href={`/search?q=${encodeURIComponent(query)}&category=${categoryFilter}&keywords=${activeKeywords.join(',')}&sort=relevance`}
            active={sort === 'relevance'} label="Relevance" icon={<Sparkles className="h-3.5 w-3.5" />}
          />
          <SortTab
            href={`/search?q=${encodeURIComponent(query)}&category=${categoryFilter}&keywords=${activeKeywords.join(',')}&sort=latest`}
            active={sort === 'latest'} label="Latest" icon={<Clock className="h-3.5 w-3.5" />}
          />
          <SortTab
            href={`/search?q=${encodeURIComponent(query)}&category=${categoryFilter}&keywords=${activeKeywords.join(',')}&sort=trending`}
            active={sort === 'trending'} label="Trending" icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
        </div>
      )}

      {/* Results */}
      {(query || categoryFilter || activeKeywords.length > 0) ? (
        articles.length > 0 ? (
          <div className="space-y-1">
            {articles.filter(a => a.image_url).length >= 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {articles.filter(a => a.image_url).slice(0, 2).map((article) => (
                  <StoryCard key={article.id} {...article} slug={article.id} variant="default" />
                ))}
              </div>
            )}
            {articles.slice(articles.filter(a => a.image_url).length >= 2 ? 2 : 0).map((article) => (
              <StoryCard key={article.id} {...article} slug={article.id} variant="list" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <SearchIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium mb-1">No results found</p>
            <p className="text-sm">
              {query ? `No articles matching "${query}"` : 'Try adjusting your filters'}
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium mb-1">Search across thousands of AI news articles</p>
          <p className="text-sm">Type a query or select a category above to get started</p>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {CATEGORIES.filter(c => c.value).map((cat) => (
              <a
                key={cat.value}
                href={`/search?category=${cat.value}`}
                className="px-3 py-1.5 text-xs rounded-full border border-border/50 bg-card hover:bg-accent hover:border-primary/30 transition-colors"
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SortTab({ href, active, label, icon }: { href: string; active: boolean; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
