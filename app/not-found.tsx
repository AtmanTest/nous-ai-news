import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        {/* AI Eye icon */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path d="M12 2a10 10 0 0 1 10 10" opacity="0.3" />
              <path d="M2 12a10 10 0 0 1 10-10" opacity="0.3" />
              <circle cx="9" cy="9" r="1" fill="currentColor" opacity="0.6" />
              <circle cx="15" cy="9" r="1" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
          {/* Animated pulse ring */}
          <div className="absolute inset-0 rounded-full ring-1 ring-primary/20 animate-pulse-soft" />
        </div>

        {/* Error code */}
        <div>
          <h1 className="text-7xl font-bold tracking-tighter text-foreground">
            404
          </h1>
          <p className="text-lg font-semibold text-foreground/80 mt-2">
            Page not found
          </p>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          This signal seems to have drifted off the network. The page you&apos;re
          looking for doesn&apos;t exist or has been moved.
        </p>

        {/* CTA to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Home
        </Link>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground/60">
          Error 404 — The requested resource was not found on this server.
        </p>
      </div>
    </div>
  );
}
