'use client';

import { PostHogProvider, usePostHog } from 'posthog-js/react';
import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function PostHogAnalyticsProvider({ children }: { children: React.ReactNode }) {
  if (!PH_KEY || PH_KEY === 'phc_dummy_key') {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={PH_KEY}
      options={{
        api_host: PH_HOST,
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug();
          }
        },
        persistence: 'localStorage',
      }}
    >
      {children}
    </PostHogProvider>
  );
}

// Client-side hook for custom events
export function useAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (posthog) {
      posthog.capture(event, properties);
    }
  }, [posthog]);

  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    if (posthog) {
      posthog.identify(userId, traits);
    }
  }, [posthog]);

  const reset = useCallback(() => {
    if (posthog) {
      posthog.reset();
    }
  }, [posthog]);

  return { capture, identify, reset, posthog };
}

// Auto-capture page views on route change (for App Router)
export function usePageTracking() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        pathname,
        searchParams: searchParams?.toString(),
      });
    }
  }, [pathname, searchParams, posthog]);
}