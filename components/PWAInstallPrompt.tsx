'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type InstallPromptProps = {
  /** Show only on mobile */
  mobileOnly?: boolean;
  /** Delay before showing prompt (ms) */
  delay?: number;
};

export function PWAInstallPrompt({ mobileOnly = true, delay = 5000 }: InstallPromptProps = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const t = useTranslations('pwa.install');

  // Mark as browser environment
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Check if app is already installed (standalone mode)
  useEffect(() => {
    if (!isBrowser) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);
  }, [isBrowser]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    if (!isBrowser) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isBrowser]);

  // Show prompt after delay if conditions met
  useEffect(() => {
    if (!isBrowser || isInstalled || deferredPrompt === null) return;

    const timer = setTimeout(() => {
      if (!mobileOnly || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setShowPrompt(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isBrowser, isInstalled, deferredPrompt, mobileOnly, delay]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('PWA install outcome:', outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    // Don't show again for 24h
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // Don't show if dismissed recently
  useEffect(() => {
    if (!isBrowser) return;
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
      setShowPrompt(false);
    }
  }, [isBrowser]);

  if (!isBrowser || isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={cn(
          'fixed bottom-4 left-4 right-4 md:left-auto md:bottom-4 md:right-4 md:w-96 z-50',
          'bg-card border border-border rounded-xl shadow-xl p-4',
          'backdrop-blur-sm bg-background/95'
        )}
        role="dialog"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{t('title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
            <p className="text-xs text-muted-foreground mt-2">{t('benefits')}</p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" />
              {t('install')}
            </motion.button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label={t('dismiss')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;