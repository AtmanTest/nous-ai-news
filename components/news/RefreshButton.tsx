'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

type RefreshState = 'idle' | 'loading' | 'success' | 'error';

export function RefreshButton() {
  const [state, setState] = useState<RefreshState>('idle');
  const [message, setMessage] = useState('');

  const handleRefresh = useCallback(async () => {
    if (state === 'loading') return;

    setState('loading');
    setMessage('');

    try {
      const res = await fetch('/api/refresh?key=nous-ai-news-refresh', {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setState('success');
      setMessage(data.message || `Added ${data.articlesAdded} article(s)`);

      // Auto-dismiss success after 4s
      setTimeout(() => {
        setState('idle');
        setMessage('');
      }, 4000);

      // Refresh the page to show new content
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Refresh failed');
      setTimeout(() => {
        setState('idle');
        setMessage('');
      }, 5000);
    }
  }, [state]);

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleRefresh}
        disabled={state === 'loading'}
        className={`p-2 rounded-md transition-colors ${
          state === 'loading'
            ? 'text-muted-foreground/50 cursor-not-allowed'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="Refresh news from all sources"
        aria-label="Refresh AI news"
      >
        <RefreshCw
          className={`h-5 w-5 ${state === 'loading' ? 'animate-spin text-primary' : ''}`}
        />
      </button>

      {/* Toast notification */}
      {message && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg text-xs font-medium whitespace-nowrap animate-fade-in ${
            state === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
              : state === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              : ''
          }`}
        >
          {state === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : state === 'error' ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          ) : null}
          <span className="max-w-[260px] truncate">{message}</span>
        </div>
      )}
    </div>
  );
}
