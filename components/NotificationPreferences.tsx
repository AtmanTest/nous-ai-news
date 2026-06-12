'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPreferencesProps {
  /** Default open state on mobile */
  defaultOpen?: boolean;
}

export function NotificationPreferences({ defaultOpen = false }: NotificationPreferencesProps = {}) {
  const t = useTranslations('push');
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [pendingTopics, setPendingTopics] = useState<string[]>([]);

  const {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    topics,
    availableTopics,
    loading,
    error,
    subscribe,
    unsubscribe,
    updateTopics,
    requestPermission,
  } = usePushNotifications();

  // Initialize pending topics from current topics
  useState(() => {
    if (subscription?.topics) {
      setPendingTopics(subscription.topics);
    }
  });

  const handleTopicToggle = (topicId: string) => {
    setPendingTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
    );
  };

  const handleSubscribe = async () => {
    try {
      await subscribe(pendingTopics);
      setIsOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleUpdateTopics = async () => {
    try {
      await updateTopics(pendingTopics);
      setIsOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
      setPendingTopics([]);
      setIsOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  if (!isSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="p-4 rounded-lg bg-amber-50 border border-amber-200"
      >
        <div className="flex items-center gap-3 text-amber-800">
          <BellOff className="h-5 w-5 shrink-0" />
          <p className="text-sm">{t('notSupported')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          )}>
            {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('title')}</h3>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? t('subscribed') : t('notSubscribed')}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            isOpen
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-accent'
          )}
        >
          {isOpen ? t('close') : t('configure')}
        </motion.button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 bg-card border border-border rounded-lg"
          >
            {/* Permission status */}
            {permission !== 'granted' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800">
                    <BellOff className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('permissionRequired')}</span>
                  </div>
                  <button
                    onClick={handleRequestPermission}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    {t('enableNotifications')}
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Topic selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('topicsLabel')}
              </label>
              <p className="text-xs text-muted-foreground mb-3">{t('topicsDescription')}</p>

              <div className="grid gap-2 sm:grid-cols-2">
                {availableTopics.map((topic) => (
                  <motion.button
                    key={topic.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleTopicToggle(topic.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
                      pendingTopics.includes(topic.id)
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border bg-background hover:border-primary/50'
                    )}
                    disabled={loading}
                  >
                    <motion.div
                      animate={{ scale: pendingTopics.includes(topic.id) ? 1 : 0.9 }}
                      className={cn(
                        'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors',
                        pendingTopics.includes(topic.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-transparent'
                      )}
                    >
                      {pendingTopics.includes(topic.id) && <Check className="h-3 w-3" />}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block">{topic.label}</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">{topic.description}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-border">
              {!isSubscribed ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubscribe}
                  disabled={loading || pendingTopics.length === 0 || permission !== 'granted'}
                  className="flex-1 px-4 py-2.5 font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('subscribing')}
                    </>
                  ) : (
                    t('subscribe')
                  )}
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateTopics}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('saving')}
                      </>
                    ) : (
                      t('saveTopics')
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="px-4 py-2.5 font-medium text-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('unsubscribing')}
                      </>
                    ) : (
                      t('unsubscribe')
                    )}
                  </motion.button>
                </>
              )}
            </div>

            {/* Current subscription info */}
            {isSubscribed && subscription && (
              <div className="pt-3 text-xs text-muted-foreground">
                <p>{t('subscribedSince', { date: new Date(subscription.created_at).toLocaleDateString() })}</p>
                <p>{t('topicsActive', { count: subscription.topics?.length || 0 })}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationPreferences;