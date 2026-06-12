import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  debug: process.env.NODE_ENV === 'development',
  
  // Ignore specific errors
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
    },
  },
});

// Export a helper to manually capture errors from server code
export { Sentry };