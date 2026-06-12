'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, ExternalLink, Loader2, Download, Heart } from 'lucide-react';

interface ModelEntry {
  id: string;
  author: string;
  name: string;
  task: string;
  downloads: number;
  likes: number;
  params: string;
  updated: string;
  link: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function LatestModels() {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchModels() {
      try {
        const res = await fetch('/api/huggingface/trending?limit=5');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) {
          setModels(data.models || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load models');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchModels();
    const interval = setInterval(fetchModels, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-secondary/80 border border-border/40 overflow-hidden">
        <h3 className="text-xl font-extrabold px-4 pt-4 pb-2">Trending Models</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || models.length === 0) {
    return (
      <div className="rounded-2xl bg-secondary/80 border border-border/40 overflow-hidden">
        <h3 className="text-xl font-extrabold px-4 pt-4 pb-2">Trending Models</h3>
        <div className="px-4 py-6 text-center">
          <Cpu className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {error ? 'Unable to load models' : 'No trending models'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {error ? 'Check back later' : 'Data from Hugging Face'}
          </p>
        </div>
        <a
          href="https://huggingface.co/models?sort=trending"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 px-4 py-3 text-[15px] text-primary hover:bg-accent/20 rounded-lg transition-colors"
        >
          View all on HF <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-secondary/80 border border-border/40 overflow-hidden">
      <h3 className="text-xl font-extrabold px-4 pt-4 pb-2">
        <span className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Trending Models
        </span>
      </h3>
      {models.map((model) => (
        <a
          key={model.id}
          href={model.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/20 rounded-lg transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold group-hover:underline truncate">
              {model.author}/{model.name}
            </p>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
              {model.params && <span>{model.params}</span>}
              {model.task && <span className="text-primary/70">{model.task}</span>}
            </div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {formatNum(model.downloads)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {model.likes}
              </span>
              <span>{timeAgo(model.updated)}</span>
            </div>
          </div>
        </a>
      ))}
      <a
        href="https://huggingface.co/models?sort=trending"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 px-4 py-3 text-[15px] text-primary hover:bg-accent/20 rounded-lg transition-colors"
      >
        View all on Hugging Face <ExternalLink className="h-4 w-4 inline" />
      </a>
    </div>
  );
}
