import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
  
  // Replay configuration
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  // Ignore specific errors
  ignoreErrors: [
    // Ignore network errors
    'Network request failed',
    'Failed to fetch',
    // Ignore hydration errors in development
    'Hydration failed',
    'hydration',
  ],
  
  // Before send hook to filter/modify events
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
  
  // Attach additional data to events
  initialScope: {
    tags: {
      app: 'nous-ai-news',
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
    },
  },
});