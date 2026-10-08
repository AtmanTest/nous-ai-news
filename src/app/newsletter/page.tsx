import type { Metadata } from 'next';
import { NewsletterForm } from '@/components/NewsletterForm';

export const metadata: Metadata = { title: 'Newsletter' };

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
        <p className="text-muted">
          Recevez une sélection des actualités IA. Démonstration : aucune adresse n’est conservée au-delà du processus
          serveur et aucun e-mail n’est envoyé.
        </p>
      </header>
      <NewsletterForm />
    </div>
  );
}
