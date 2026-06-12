'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        {/* Error icon */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 text-destructive"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          {/* Animated pulse ring */}
          <div className="absolute inset-0 rounded-full ring-1 ring-destructive/20 animate-pulse-soft" />
        </div>

        {/* Error code */}
        <div>
          <h1 className="text-7xl font-bold tracking-tighter text-foreground">
            500
          </h1>
          <p className="text-lg font-semibold text-foreground/80 mt-2">
            Something went wrong
          </p>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred while processing your request. Our AI
          systems have been notified and will investigate shortly.
        </p>

        {/* Error detail (dev-friendly) */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono bg-muted/30 px-3 py-1.5 rounded-md">
            Error digest: {error.digest}
          </p>
        )}

        {/* Retry button */}
        <Button
          variant="default"
          onClick={() => reset()}
          className="rounded-full px-6"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Try Again
        </Button>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground/60">
          Error 500 — Internal server error.
        </p>
      </div>
    </div>
  );
}
