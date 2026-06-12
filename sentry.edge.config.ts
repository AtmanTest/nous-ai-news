import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  debug: process.env.NODE_ENV === 'development',
  
  // Ignore specific errors common in edge runtime
  ignoreErrors: [
    'Network request failed',
    'Failed to fetch',
    'Hydration failed',
    'hydration',
  ],
  
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
  
  initialScope: {
    tags: {
      app: 'nous-ai-news',
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
      runtime: 'edge',
    },
  },
});