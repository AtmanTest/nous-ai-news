import Link from 'next/link';

export default function NotFound() {
  return (
    <div data-testid="not-found" className="mx-auto max-w-xl space-y-4 py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page introuvable</h1>
      <p className="text-muted">La page que vous cherchez n’existe pas ou a été déplacée.</p>
      <p>
        <Link href="/" className="font-medium text-accent underline underline-offset-4">
          Retour à l’accueil
        </Link>
      </p>
    </div>
  );
}
