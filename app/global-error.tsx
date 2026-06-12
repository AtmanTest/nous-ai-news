'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem',
            backgroundColor: '#000',
            color: '#e7e9ea',
            fontFamily:
              'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '28rem',
              textAlign: 'center',
              gap: '1.5rem',
            }}
          >
            {/* Error icon */}
            <div
              style={{
                position: 'relative',
                width: '5rem',
                height: '5rem',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  color: '#ef4444',
                }}
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

            <div>
              <h1 style={{ fontSize: '4.5rem', fontWeight: 700, letterSpacing: '-0.05em', margin: 0 }}>
                500
              </h1>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.5rem', opacity: 0.8 }}>
                Critical system error
              </p>
            </div>

            <p style={{ fontSize: '0.875rem', opacity: 0.6, lineHeight: 1.625 }}>
              A critical error occurred that prevented the page from loading. Our
              engineering team has been automatically notified.
            </p>

            <button
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: '9999px',
                background: '#1d9bf0',
                color: '#fff',
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                style={{ width: '1rem', height: '1rem' }}
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
            </button>

            <p style={{ fontSize: '0.75rem', opacity: 0.4 }}>
              Error 500 — Internal server error.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
