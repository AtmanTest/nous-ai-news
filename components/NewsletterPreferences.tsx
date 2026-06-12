'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, Check, X, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface NewsletterPreferencesProps {}

export function NewsletterPreferences() {
  const t = useTranslations('settings.newsletter');
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage(t('invalidEmail'));
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(t('confirmSent'));
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || t('error'));
      }
    } catch {
      setStatus('error');
      setMessage(t('error'));
    }
  };

  return (
    <SectionCard title={t('title')} icon={Mail}>
      <form onSubmit={handleSubscribe} className="space-y-4">
        <div>
          <label htmlFor="newsletter-email" className="block text-sm font-medium text-muted-foreground mb-1.5">
            {t('emailLabel')}
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-input/50 text-foreground placeholder:text-muted-foreground/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent',
              'transition-colors'
            )}
            disabled={status === 'loading'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            {t('frequencyLabel')}
          </label>
          <div className="flex gap-3">
            <label className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors',
              frequency === 'daily'
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/50 bg-card hover:bg-accent/50 text-foreground'
            )}>
              <input
                type="radio"
                name="frequency"
                value="daily"
                checked={frequency === 'daily'}
                onChange={() => setFrequency('daily')}
                className="sr-only"
              />
              {t('daily')}
            </label>
            <label className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors',
              frequency === 'weekly'
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/50 bg-card hover:bg-accent/50 text-foreground'
            )}>
              <input
                type="radio"
                name="frequency"
                value="weekly"
                checked={frequency === 'weekly'}
                onChange={() => setFrequency('weekly')}
                className="sr-only"
              />
              {t('weekly')}
            </label>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              )}
            >
              {status === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg font-medium transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            status === 'loading' || !email
              ? 'bg-primary/50 text-primary-foreground/50 cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
          )}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('subscribing')}
            </>
          ) : (
            t('subscribe')
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          {t('privacy')}
        </p>
      </form>
    </SectionCard>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card p-4 sm:p-5', className)}>
      <h2 className="flex items-center gap-2 text-base font-bold mb-4">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  );
}