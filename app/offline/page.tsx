'use client';

export const dynamic = 'force-dynamic';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" role="heading">
          You're offline
        </h1>
        <p className="text-muted-foreground mb-6">
          It looks like you've lost your internet connection. 
          <br />
          Cached pages are available for browsing.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity mr-4"
          role="button"
        >
          Try Again
        </button>
        <a
          href="/"
          className="px-6 py-3 border border-input rounded-lg font-medium hover:bg-accent transition-colors"
          role="link"
        >
          Go to Home Page
        </a>
        <p className="text-xs text-muted-foreground mt-6">
          Nous AI News
        </p>
      </div>
    </div>
  );
}