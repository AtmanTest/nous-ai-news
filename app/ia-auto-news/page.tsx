'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, Brain, Globe, ExternalLink, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface IaAutoNewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string;
  published_date: string;
  theme: string;
  sources_analyzed: string[];
  created_at: string;
}

// Check for required env vars at module level
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MISSING_ENV = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export default function IaAutoNewsPage() {
  const [articles, setArticles] = useState<IaAutoNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        // Check env vars before creating client
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
        
        setArticles(data || []);
        if (data && data.length > 0) {
          setLatestDate(data[0].published_date);
        }
      } catch (err) {
        console.error('Erreur chargement articles:', err);
        setError('Impossible de charger les articles');
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 text-primary mb-6 animate-pulse">
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Chargement des articles IA...</h2>
            <p className="text-purple-300">DeepMind analyse l'actualité mondiale</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <article key={n} className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
                <div className="w-full h-48 bg-gradient-to-r from-purple-800/50 to-indigo-800/50 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-white/20 rounded w-1/4 animate-pulse" />
                  <div className="h-8 bg-white/30 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/15 rounded w-full animate-pulse" />
                  <div className="h-4 bg-white/15 rounded w-5/6 animate-pulse" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <span className="text-red-200 font-medium">Erreur de configuration</span>
            </div>
            <p className="text-red-300 mb-4">{error}</p>
            <div className="text-xs text-red-500 mb-4">
              Vérifiez les variables d'environnement dans Vercel : Settings → Environment Variables
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

  const ArticlesGrid = () => {
    if (articles.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {articles.map((article) => (
            <article 
              key={article.id}
              className="group bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-white/10"
            >
              <div className="relative h-56 md:h-64 overflow-hidden">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-purple-200 text-xs font-medium px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                    {article.theme}
                  </span>
                  <time className="text-purple-300 text-xs px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                    {formatDateShort(article.published_date)}
                  </time>
                </div>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight group-hover:text-purple-200 transition-colors">
                  {article.title}
                </h2>
                <p className="text-gray-200 leading-relaxed mb-5 text-sm md:text-base">
                  {article.content}
                </p>
                
                {article.sources_analyzed && article.sources_analyzed.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-purple-300 flex flex-wrap items-center gap-1">
                      <Brain className="h-3 w-3" />
                      Sources analysées:{" "}
                      {article.sources_analyzed.map((s, i) => (
                        <span key={i} className="bg-white/10 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center text-purple-300 py-16">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 mb-6">
          <Brain className="h-12 w-12 text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Aucun article pour le moment</h3>
        <p className="text-purple-300 max-w-md mx-auto mb-6">
          DeepMind n&apos;a pas encore g&eacute;n&eacute;r&eacute; d&apos;articles. Le cron s&apos;ex&eacute;cute chaque jour &agrave; 6:00 AM 
          pour scraper l&apos;actualit&eacute; et cr&eacute;er de nouveaux contenus philosophiques.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition"
        >
          Actualiser la page
        </button>
      </div>
    );
  };

  return (
    <section className="py-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12 relative">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/10">
            <div className="flex items-center gap-2 bg-primary/20 text-primary rounded-full p-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-purple-200 text-sm font-medium">
              {latestDate ? `Édition du ${formatDate(latestDate)}` : 'Dernière édition'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            ✨ IA AUTO NEWS
          </h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto mb-6">
            L&apos;IA philosophe <strong className="text-white">DeepMind</strong> analyse l&apos;actualit&eacute; mondiale 
            (<span className="text-purple-300">20 Minutes</span>, <span className="text-purple-300">BBC News</span>, <span className="text-purple-300">Google Actualit&eacute;s</span>) 
            et &eacute;crit des articles lumineux sur l&apos;&eacute;volution humaine et le futur.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 text-sm text-purple-300">
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Globe className="h-3 w-3" /> 20 Minutes</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Globe className="h-3 w-3" /> BBC News</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Globe className="h-3 w-3" /> Google Actualit&eacute;s</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Brain className="h-3 w-3" /> DeepSeek</span>
            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Sparkles className="h-3 w-3" /> DALL-E 3</span>
          </div>
        </header>

        <ArticlesGrid />

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-xs text-purple-400">
          <p className="mb-2">
            🤖 G&eacute;n&eacute;r&eacute; automatiquement par <strong>DeepMind (DeepSeek)</strong> + <strong>DALL-E 3</strong>
          </p>
          <p>
            📅 Cron quotidien 6:00 AM · 🔄 Actualisation manuelle disponible · 
            <a href="https://github.com/AtmanTest/nous-ai-news" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-200">
              View on GitHub
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}