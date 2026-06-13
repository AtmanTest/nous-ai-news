'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, Brain, Globe, ExternalLink, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface IaAutoNewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published_date: string;
  theme: string;
  sources_analyzed: string[];
  created_at: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MISSING_ENV = !SUPABASE_URL || !SUPABASE_ANON_KEY;
const PAGE_SIZE = 10;

const THEME_COLORS: Record<string, { gradient: string; icon: string }> = {
  'Écologie': { gradient: 'from-green-900/50 to-emerald-900/50', icon: '🌿' },
  'Guerre': { gradient: 'from-red-900/50 to-orange-900/50', icon: '⚔️' },
  'Art': { gradient: 'from-purple-900/50 to-pink-900/50', icon: '🎨' },
  'Société': { gradient: 'from-blue-900/50 to-indigo-900/50', icon: '👥' },
  'Technologie': { gradient: 'from-indigo-900/50 to-purple-900/50', icon: '🔬' },
  'Économie': { gradient: 'from-yellow-900/50 to-amber-900/50', icon: '💰' },
};

function GradientFallback({ theme }: { theme: string }) {
  const { gradient } = THEME_COLORS[theme] || THEME_COLORS['Technologie'];
  return (
    <div className={`w-full h-64 md:h-72 ${gradient} flex items-center justify-center`}>
      <Brain className="h-20 w-20 text-white/30" />
    </div>
  );
}

function ArticleCard({ article, index }: { article: IaAutoNewsArticle; index: number }) {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const themeData = THEME_COLORS[article.theme] || THEME_COLORS['Technologie'];
  
  return (
    <article 
      key={article.id}
      className="group relative w-full max-w-3xl mx-auto bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 100, 500)}ms` }}
    >
      {/* Image header */}
      <div className="relative overflow-hidden">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            priority={index < 3}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        ) : (
          <GradientFallback theme={article.theme} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/95 via-purple-950/50 to-transparent" />
        
        {/* Theme badge & date overlay */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white whitespace-nowrap">
            <span>{themeData.icon}</span>
            {article.theme}
          </span>
          <time className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-purple-200 whitespace-nowrap">
            {formatDate(article.published_date)}
          </time>
        </div>
      </div>

      {/* Article content */}
      <div className="p-5 md:p-8">
        {/* Title - FULL, no clamp */}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 md:mb-6 leading-tight">
          {article.title}
        </h2>

        {/* Content - FULL, no clamp, proper typography */}
        <div className="prose prose-invert max-w-none text-gray-100 leading-relaxed text-base md:text-lg">
          <p className="whitespace-pre-wrap">{article.content}</p>
        </div>

        {/* Sources */}
        {article.sources_analyzed && article.sources_analyzed.length > 0 && (
          <div className="mt-6 md:mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <span className="text-sm font-medium text-purple-300">Sources analysées :</span>
              {article.sources_analyzed.map((s, i) => (
                <span key={i} className="bg-white/5 px-3 py-1 rounded-full text-xs text-purple-200 border border-white/10 whitespace-nowrap">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mt-8 md:mt-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </article>
  );
}

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {[...Array(count)].map((_, i) => (
        <article key={i} className="w-full bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 animate-pulse">
          <div className="w-full h-64 md:h-72 bg-gradient-to-r from-purple-800/50 to-indigo-800/50" />
          <div className="p-5 md:p-8 space-y-4">
            <div className="h-6 bg-white/20 rounded w-3/4" />
            <div className="h-5 bg-white/15 rounded w-full" />
            <div className="h-5 bg-white/15 rounded w-full" />
            <div className="h-5 bg-white/10 rounded w-5/6" />
            <div className="h-5 bg-white/10 rounded w-4/5" />
            <div className="h-px bg-white/10 my-4" />
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 bg-white/10 rounded-full" />
              <div className="h-6 w-24 bg-white/10 rounded-full" />
              <div className="h-6 w-28 bg-white/10 rounded-full" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="bg-red-900/30 border border-red-700 rounded-2xl p-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <span className="text-red-200 font-medium text-lg">Erreur de chargement</span>
        </div>
        <p className="text-red-300 mb-6">{message}</p>
        <div className="text-xs text-red-500 mb-6">
          Vérifiez les variables d'environnement dans Vercel → Settings → Environment Variables
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 mb-6">
        <Brain className="h-12 w-12 text-purple-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Aucun article pour le moment</h3>
      <p className="text-purple-300 mb-6 max-w-md mx-auto">
        DeepMind n'a pas encore généré d'articles. Le cron s'exécute chaque jour à 6:00 AM pour scraper l'actualité et créer de nouveaux contenus philosophiques.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
      >
        Actualiser la page
      </button>
    </div>
  );
}

function LoadMoreButton({ onClick, loading, hasMore }: { onClick: () => void; loading: boolean; hasMore: boolean }) {
  if (!hasMore) return null;
  
  return (
    <div className="max-w-3xl mx-auto mt-8 md:mt-12">
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-2xl font-medium text-white transition-all duration-300 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement...
          </>
        ) : (
          <>
            <span>Voir plus d'articles</span>
            <ChevronRight className="h-5 w-5" />
          </>
        )}
      </button>
    </div>
  );
}

export default function IaAutoNewsPage() {
  const [articles, setArticles] = useState<IaAutoNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [offset, setOffset] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchArticles = useCallback(async (pageOffset: number, isLoadMore = false) => {
    try {
      if (MISSING_ENV) {
        throw new Error('Variables d\'environnement Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY). Configurez-les dans Vercel.');
      }

      const supabase = createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

      const { data, error: fetchError } = await supabase
        .from('ia_auto_news')
        .select('*')
        .order('published_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageOffset, pageOffset + PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      // Client-side filter as fallback: exclude test articles
      const filteredData = (data || []).filter(a => !a.title.toLowerCase().includes('test'));

      if (isLoadMore) {
        setArticles(prev => [...prev, ...filteredData]);
      } else {
        setArticles(filteredData);
        if (filteredData && filteredData.length > 0) {
          setLatestDate(filteredData[0].published_date);
        }
      }

      setHasMore(filteredData.length === PAGE_SIZE);
    } catch (err) {
      console.error('Erreur chargement articles:', err);
      if (!isLoadMore) {
        setError(err instanceof Error ? err.message : 'Impossible de charger les articles');
      }
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (MISSING_ENV) {
          throw new Error('Variables d\'environnement Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY). Configurez-les dans Vercel.');
        }

        const supabase = createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

        const { data, error: fetchError } = await supabase
          .from('ia_auto_news')
          .select('*')
          .order('published_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (fetchError) throw fetchError;

        // Client-side filter: exclude test articles
        const filteredData = (data || []).filter(a => !a.title.toLowerCase().includes('test'));

        if (mounted) {
          setArticles(filteredData);
          setHasMore(filteredData.length === PAGE_SIZE);
          if (filteredData && filteredData.length > 0) {
            setLatestDate(filteredData[0].published_date);
          }
        }
      } catch (err) {
        console.error('Erreur chargement articles:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Impossible de charger les articles');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchArticles(offset, true);
          setOffset(prev => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, offset, fetchArticles]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black py-10 md:py-14 px-4 md:px-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header - NOT sticky (scrolls with content) */}
        <header className="mb-8 md:mb-12 pb-6 bg-gradient-to-b from-indigo-900/80 to-transparent backdrop-blur-xl rounded-2xl border border-white/10">
          <div className="p-4 md:p-6">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-white/10">
              <div className="flex items-center gap-2 bg-purple-600/20 text-purple-400 rounded-full p-1.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-purple-200 text-sm font-medium">
                {latestDate ? `Édition du ${formatDate(latestDate)}` : 'Dernière édition'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              ✨ IA AUTO NEWS
            </h1>
            <p className="text-purple-200 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">
              L'IA philosophe <strong className="text-white">DeepMind</strong> analyse l'actualité mondiale 
              (<span className="text-purple-300">20 Minutes</span>, <span className="text-purple-300">BBC News</span>, <span className="text-purple-300">Google Actualités</span>) 
              et écrit des articles lumineux sur l'évolution humaine et le futur.
            </p>
            <div className="flex flex-wrap justify-start gap-1.5 text-xs text-purple-300">
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full"><Globe className="h-3 w-3" /> 20 Minutes</span>
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full"><Globe className="h-3 w-3" /> BBC</span>
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full"><Globe className="h-3 w-3" /> Google Actualités</span>
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full"><Brain className="h-3 w-3" /> DeepSeek</span>
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full"><Sparkles className="h-3 w-3" /> DALL-E 3</span>
            </div>
          </div>
        </header>

        {/* Feed */}
        <main className="space-y-8">
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : error ? (
            <ErrorState message={error} />
          ) : articles.length > 0 ? (
            <>
              {articles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
              
              {/* Infinite scroll trigger / Load more button */}
              <div ref={loadMoreRef} className="h-4">
                <LoadMoreButton 
                  onClick={() => {
                    setLoadingMore(true);
                    fetchArticles(offset, true);
                    setOffset(prev => prev + PAGE_SIZE);
                  }} 
                  loading={loadingMore} 
                  hasMore={hasMore} 
                />
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 md:mt-16 pt-8 border-t border-white/10 text-center text-xs text-purple-400">
          <p className="mb-2">
            🤖 Généré automatiquement par <strong>DeepMind (DeepSeek)</strong> + <strong>DALL-E 3</strong>
          </p>
          <p>
            📅 Cron quotidien 6:00 AM · 🔄 Scroll infini · 
            <a href="https://github.com/AtmanTest/nous-ai-news" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-200 transition">
              Voir sur GitHub
            </a>
          </p>
        </footer>
      </div>
    </section>
  );
}