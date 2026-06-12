'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeywordFilterProps {
  keywords: string[];
  activeKeywords: string[];
  maxDisplay?: number;
}

const PRESET_CATEGORIES: Record<string, { label: string; keywords: string[] }> = {
  'OpenAI': { label: 'OpenAI', keywords: ['openai', 'chatgpt', 'gpt-5', 'gpt-4', 'o3', 'sam altman'] },
  'Google': { label: 'Google', keywords: ['google', 'deepmind', 'gemini', 'veo'] },
  'Anthropic': { label: 'Anthropic', keywords: ['anthropic', 'claude'] },
  'Meta': { label: 'Meta', keywords: ['meta', 'llama', 'facebook'] },
  'NVIDIA': { label: 'NVIDIA', keywords: ['nvidia', 'blackwell', 'h100', 'gpu'] },
  'Mistral': { label: 'Mistral', keywords: ['mistral', 'mixtral', 'le chat'] },
  'Agents': { label: 'Agents', keywords: ['agent', 'agents', 'agentic', 'autonomous'] },
  'Hardware': { label: 'Hardware', keywords: ['hardware', 'chip', 'processor', 'semiconductor'] },
  'Funding': { label: 'Funding', keywords: ['funding', 'fundraise', 'investment', 'valuation'] },
};

export function KeywordFilter({ keywords, activeKeywords, maxDisplay = 30 }: KeywordFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAll, setShowAll] = useState(false);
  const [customKeyword, setCustomKeyword] = useState('');

  const buildUrl = useCallback((newKws: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newKws.length > 0) {
      params.set('keywords', newKws.join(','));
    } else {
      params.delete('keywords');
    }
    return `/search?${params.toString()}`;
  }, [searchParams]);

  const toggle = useCallback((kw: string) => {
    const lower = kw.toLowerCase();
    const next = activeKeywords.includes(lower)
      ? activeKeywords.filter(k => k !== lower)
      : [...activeKeywords, lower];
    router.push(buildUrl(next));
  }, [activeKeywords, buildUrl, router]);

  const addCustom = () => {
    const trimmed = customKeyword.trim().toLowerCase();
    if (trimmed && !activeKeywords.includes(trimmed)) {
      router.push(buildUrl([...activeKeywords, trimmed]));
    }
    setCustomKeyword('');
  };

  const applyPreset = useCallback((presetKws: string[]) => {
    const anyActive = presetKws.some(k => activeKeywords.includes(k));
    if (anyActive) {
      router.push(buildUrl(activeKeywords.filter(k => !presetKws.includes(k))));
    } else {
      const unique = [...new Set([...activeKeywords, ...presetKws])];
      router.push(buildUrl(unique));
    }
  }, [activeKeywords, buildUrl, router]);

  const clearAll = useCallback(() => {
    router.push(buildUrl([]));
  }, [buildUrl, router]);

  const displayKeywords = showAll ? keywords : keywords.slice(0, maxDisplay);

  return (
    <div className="space-y-3">
      {/* Preset company filters */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
        {Object.entries(PRESET_CATEGORIES).map(([key, val]) => {
          const isActive = val.keywords.some(k => activeKeywords.includes(k));
          return (
            <button
              key={key}
              onClick={() => applyPreset(val.keywords)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-full border transition-colors text-center',
                isActive
                  ? 'bg-primary/15 text-primary border-primary/30 font-medium'
                  : 'border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Active keywords chips */}
      {activeKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {activeKeywords.map(kw => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20"
            >
              {kw}
              <button onClick={() => toggle(kw)} className="hover:text-primary/60">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Popular keywords chips */}
      {keywords.length > 0 && (
        <>
          <div className="text-xs text-muted-foreground">Popular keywords</div>
          <div className="flex flex-wrap gap-1.5">
            {displayKeywords.map(kw => (
              <button
                key={kw}
                onClick={() => toggle(kw)}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-md border transition-colors',
                  activeKeywords.includes(kw)
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground'
                )}
              >
                {kw}
              </button>
            ))}
            {keywords.length > maxDisplay && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="text-xs text-muted-foreground hover:text-foreground px-1"
              >
                +{keywords.length - maxDisplay} more
              </button>
            )}
          </div>
        </>
      )}

      {/* Custom keyword input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customKeyword}
          onChange={e => setCustomKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add custom keyword..."
          className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-border/30 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={addCustom}
          disabled={!customKeyword.trim()}
          className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-30 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
