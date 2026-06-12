'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SSEMessage {
  type: 'connected' | 'heartbeat' | 'new-articles';
  count?: number;
  timestamp: number;
}

export function useLiveUpdates(onNewArticles?: (count: number) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [newArticlesCount, setNewArticlesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const t = useTranslations('liveUpdates');

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/events');
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            setIsConnected(true);
            break;
          case 'heartbeat':
            // Keep alive
            break;
          case 'new-articles':
            if (data.count && data.count > 0) {
              setNewArticlesCount(data.count);
              onNewArticles?.(data.count);
            }
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      setError(t('connectionError'));
      
      es.close();
      
      // Exponential backoff reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        setError(t('maxRetriesReached'));
      }
    };
  }, [onNewArticles, t]);

  const dismiss = useCallback(() => {
    setNewArticlesCount(0);
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    isConnected,
    newArticlesCount,
    error,
    dismiss,
    reconnect,
  };
}

// ── Live Updates Badge Component ────────────────────────────────────────────

export function LiveUpdatesBadge() {
  const { isConnected, newArticlesCount, error, dismiss, reconnect } = useLiveUpdates();
  const t = useTranslations('liveUpdates');

  if (!newArticlesCount && !error) return null;

  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive/90 text-destructive-foreground rounded-lg shadow-lg backdrop-blur-sm border border-destructive/20">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">{t('reconnecting')}</span>
            <button onClick={reconnect} className="text-xs underline hover:no-underline">{t('retry')}</button>
          </div>
        </motion.div>
      )}

      {newArticlesCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/95 text-primary-foreground rounded-lg shadow-lg backdrop-blur-sm border border-primary/20">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {t('newArticles', { count: newArticlesCount })}
            </span>
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-1 text-xs bg-primary-foreground/20 rounded hover:bg-primary-foreground/30"
            >
              {t('refresh')}
            </button>
            <button onClick={dismiss} className="text-lg leading-none hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}