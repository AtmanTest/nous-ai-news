'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushSubscriptionData {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: string[];
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscriptionData | null;
  topics: string[];
  availableTopics: { id: string; label: string; description: string }[];
  loading: boolean;
  error: string | null;
  subscribe: (topics?: string[]) => Promise<void>;
  unsubscribe: () => Promise<void>;
  updateTopics: (topics: string[]) => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

const TOPIC_OPTIONS = [
  { id: 'trending', label: 'Trending Articles', description: 'Most popular articles right now' },
  { id: 'breaking', label: 'Breaking News', description: 'Major announcements as they happen' },
  { id: 'models', label: 'New Models', description: 'New LLM releases and updates' },
  { id: 'research', label: 'Research Papers', description: 'New papers and breakthroughs' },
  { id: 'business', label: 'Business & Funding', description: 'Funding rounds, acquisitions, IPOs' },
  { id: 'policy', label: 'Policy & Regulation', description: 'AI regulation and government actions' },
] as const;

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const t = useTranslations('push');
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTopics = TOPIC_OPTIONS.map((opt) => ({
    id: opt.id,
    label: t(`topics.${opt.id}.label`, { defaultValue: opt.label }),
    description: t(`topics.${opt.id}.description`, { defaultValue: opt.description }),
  }));

  // Check support and permission on mount
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch existing subscription for current user
  useEffect(() => {
    if (!user || !isSupported) return;

    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/push/subscriptions');
        if (response.ok) {
          const data = await response.json();
          if (data.subscription) {
            setSubscription(data.subscription);
            setIsSubscribed(true);
            setTopics(data.subscription.topics || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch push subscription:', err);
      }
    };

    fetchSubscription();
  }, [user, isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied';

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    } catch (err) {
      console.error('Permission request failed:', err);
      return 'denied';
    }
  }, [isSupported]);

  const getVapidPublicKey = useCallback(async () => {
    const response = await fetch('/api/push/vapid-public-key');
    if (!response.ok) throw new Error('Failed to get VAPID key');
    const { publicKey } = await response.json();
    return publicKey;
  }, []);

  const urlBase64ToUint8Array = useCallback((base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  const subscribe = useCallback(async (selectedTopics: string[] = []) => {
    if (!user || !isSupported) {
      setError(t('errors.notSupported'));
      return;
    }

    if (permission !== 'granted') {
      const perm = await requestPermission();
      if (perm !== 'granted') {
        setError(t('errors.permissionDenied'));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Register service worker if not already
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidPublicKey = await getVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subscriptionJson = pushSubscription.toJSON() as PushSubscription;

      // Send to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || '',
          },
          topics: selectedTopics,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Subscription failed');
      }

      const { subscription: savedSub } = await response.json();
      setSubscription(savedSub);
      setIsSubscribed(true);
      setTopics(savedSub.topics || []);
    } catch (err: any) {
      console.error('Push subscribe error:', err);
      setError(err.message || t('errors.subscribeFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isSupported, permission, requestPermission, getVapidPublicKey, urlBase64ToUint8Array, t]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setLoading(true);
    setError(null);

    try {
      // Unregister from browser
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Notify backend
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      if (!response.ok) {
        throw new Error('Unsubscribe failed');
      }

      setSubscription(null);
      setIsSubscribed(false);
      setTopics([]);
    } catch (err: any) {
      console.error('Push unsubscribe error:', err);
      setError(err.message || t('errors.unsubscribeFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription, t]);

  const updateTopics = useCallback(async (newTopics: string[]) => {
    if (!subscription) return;

    setLoading(true);
    setError(null);

    try {
      // Re-subscribe with new topics
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      if (!pushSubscription) throw new Error('No subscription found');

      const subscriptionJson = pushSubscription.toJSON() as PushSubscription;

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || '',
          },
          topics: newTopics,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Update topics failed');
      }

      const { subscription: savedSub } = await response.json();
      setSubscription(savedSub);
      setTopics(savedSub.topics || []);
    } catch (err: any) {
      console.error('Update topics error:', err);
      setError(err.message || t('errors.updateFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription, t]);

  return {
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
  };
}

export default usePushNotifications;