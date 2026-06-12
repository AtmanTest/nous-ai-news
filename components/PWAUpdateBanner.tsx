'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function PWAUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const t = useTranslations('pwa.update');

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (!isBrowser || !('serviceWorker' in navigator)) return;

    // Check for updates periodically
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      } catch (error) {
        console.log('PWA update check failed:', error);
      }
    };

    // Listen for controller change (new SW took over)
    const handleControllerChange = () => {
      if (navigator.serviceWorker.controller) {
        window.location.reload();
      }
    };

    // Initial check
    checkForUpdates();

    // Check every 30 minutes
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [isBrowser]);

  const handleUpdate = useCallback(async () => {
    setUpdating(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      // Force reload after short delay
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('PWA update failed:', error);
      setUpdating(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setUpdateAvailable(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-update-dismissed', 'true');
  }, []);

  if (!isBrowser || !updateAvailable || sessionStorage.getItem('pwa-update-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 border-b border-border',
          'bg-card/95 backdrop-blur-sm shadow-md'
        )}
        role="status"
        aria-live="polite"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: updating ? 360 : 0 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className={cn(
                  'p-2 rounded-lg bg-primary/10 text-primary',
                  updating && 'text-primary'
                )}
              >
                {updating ? <Check className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
              </motion.span>
              <div>
                <p className="font-medium text-foreground">{t('title')}</p>
                <p className="text-sm text-muted-foreground">
                  {updating ? t('updating') : t('description')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!updating && (
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('refresh')}
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label={t('dismiss')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PWAUpdateBanner;