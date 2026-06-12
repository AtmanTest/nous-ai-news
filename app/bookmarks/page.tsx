'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, UserPlus, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const t = useTranslations('bookmarks');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="animate-pulse flex justify-center">
            <Bookmark className="h-12 w-12 text-muted-foreground/30" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <Lock className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-semibold mb-3">{t('signInRequired.title')}</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('signInRequired.description')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              {t('signInRequired.signUp')}
            </Link>
            <Link
              href="/trending"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent transition-all"
            >
              {t('signInRequired.browse')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground/60">{t('signInRequired.note')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Empty State for logged-in user */}
      <div className="text-center py-16">
        <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-lg font-medium mb-2">{t('empty.title')}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t('empty.description')}</p>
        <Link
          href="/trending"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
        >
          {t('empty.browseTrending')}
        </Link>
      </div>
    </div>
  );
}