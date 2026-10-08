'use client';

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" data-testid="error-boundary" className="mx-auto max-w-xl space-y-4 py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Une erreur est survenue</h1>
      <p className="text-muted">Le chargement de cette page a échoué. Vous pouvez réessayer.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-dark"
      >
        Réessayer
      </button>
    </div>
  );
}
