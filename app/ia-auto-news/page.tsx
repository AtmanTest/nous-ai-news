'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, Brain, Globe, ExternalLink, AlertCircle, ChevronRight } from 'lucide-react';
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

function GradientFallback({ theme }: { theme: string }) {
  const colors: Record<string, string> = {
    'Écologie': 'from-green-900/50 to-emerald-900/50',
    'Guerre': 'from-red-900/50 to-orange-900/50',
    'Art': 'from-purple-900/50 to-pink-900/50',
    'Société': 'from-blue-900/50 to-indigo-900/50',
    'Technologie': 'from-indigo-900/50 to-purple-900/50',
    'Économie': 'from-yellow-900/50 to-amber-900/50',
  };
  return (
    <div className={`w-full h-56 md:h-64 ${colors[theme] || 'from-indigo-900/50 to-purple-900/50'} flex items-center justify-center`}>
      <Brain className="h-16 w-16 text-white/30" />
    </div>
  );
}

function ArticleCard({ article }: { article: IaAutoNewsArticle }) {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <article className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col h-full">
      <div className="relative overflow-hidden">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <GradientFallback theme={article.theme} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          <span className="text-purple-200 text-xs font-medium px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full whitespace-nowrap">
            {article.theme}
          </span>
          <time className="text-purple-300 text-xs px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full whitespace-nowrap">
            {formatDate(article.published_date)}
          </time>
        </div>
      </div>
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h2 className="text-lg md:text-xl font-bold text-white mb-3 leading-tight line-clamp-3">
          {article.title}
        </h2>
        <p className="text-gray-200 leading-relaxed mb-4 text-sm md:text-base flex-1 line-clamp-4">
          {article.content}
        </p>
        {article.sources_analyzed && article.sources_analyzed.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-purple-300 flex flex-wrap items-center gap-1.5">
              <Brain className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium">Sources:</span>
              {article.sources_analyzed.map((s, i) => (
                <span key={i} className="bg-white/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                  {s}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <article key={n} className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 animate-pulse">
          <div className="w-full h-56 md:h-64 bg-gradient-to-r from-purple-800/50 to-indigo-800/50" />
          <div className="p-5 md:p-6 space-y-4">
            <div className="h-4 bg-white/20 rounded w-3/4" />
            <div className="h-8 bg-white/30 rounded w-full" />
            <div className="h-4 bg-white/15 rounded w-full" />
            <div className="h-4 bg-white/15 rounded w-5/6" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        </article>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
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

export default function IaAutoNewsPage() {
  const [articles, setArticles] = useState<IaAutoNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function fetchArticles() {
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
          .limit(20);

        if (fetchError) throw fetchError;
        
        if (mounted) {
          setArticles(data || []);
          if (data && data.length > 0) {
            setLatestDate(data[0].published_date);
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
    }

    fetchArticles();
    
    return () => { mounted = false; };
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10 md:mb-14 relative">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/10">
            <div className="flex items-center gap-2 bg-purple-600/20 text-purple-400 rounded-full p-1.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-purple-200 text-sm font-medium">
              {latestDate ? `Édition du ${formatDate(latestDate)}` : 'Dernière édition'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            ✨ IA AUTO NEWS
          </h1>
          <p className="text-purple-200 text-base md:text-lg max-w-3xl mx-auto mb-8 leading-relaxed">
            L'IA philosophe <strong className="text-white">DeepMind</strong> analyse l'actualité mondiale 
            (<span className="text-purple-300">20 Minutes</span>, <span className="text-purple-300">BBC News</span>, <span className="text-purple-300">Google Actualités</span>) 
            et écrit des articles lumineux sur l'évolution humaine et le futur.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-purple-300">
            <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full"><Globe className="h-3 w-3" /> 20 Minutes</span>
            <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full"><Globe className="h-3 w-3" /> BBC News</span>
            <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full"><Globe className="h-3 w-3" /> Google Actualités</span>
            <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full"><Brain className="h-3 w-3" /> DeepSeek</span>
            <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full"><Sparkles className="h-3 w-3" /> DALL-E 3</span>
          </div>
        </header>

        {/* Content */}
        <main>
          {loading && <LoadingSkeleton />}
          {error && <ErrorState message={error} />}
          {articles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
          {!loading && !error && articles.length === 0 && <EmptyState />}
        </main>

        {/* Footer */}
        <footer className="mt-12 md:mt-16 pt-8 border-t border-white/10 text-center text-xs text-purple-400">
          <p className="mb-2">
            🤖 Généré automatiquement par <strong>DeepMind (DeepSeek)</strong> + <strong>DALL-E 3</strong>
          </p>
          <p>
            📅 Cron quotidien 6:00 AM · 🔄 Actualisation manuelle · 
            <a href="https://github.com/AtmanTest/nous-ai-news" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-200 transition">
              Voir sur GitHub
            </a>
          </p>
        </footer>
      </div>
    </section>
  );
}