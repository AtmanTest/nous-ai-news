'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { TOPICS } from '@/modules/topics/topics';

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

interface ApiFieldError {
  field: string;
  message: string;
}

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus({ kind: 'pending' });
    setFieldErrors({});

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(data.get('email') ?? ''),
          consent: data.get('consent') === 'on',
          topics: data.getAll('topics').map(String),
        }),
      });

      if (response.status === 201) {
        setStatus({ kind: 'success', message: 'Merci ! Votre inscription est confirmée.' });
        form.reset();
        return;
      }
      if (response.status === 200) {
        setStatus({ kind: 'success', message: 'Vous êtes déjà inscrit(e) avec cette adresse.' });
        return;
      }
      if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as { error?: { details?: ApiFieldError[] } } | null;
        const errors: Record<string, string> = {};
        for (const detail of body?.error?.details ?? []) errors[detail.field] = detail.message;
        setFieldErrors(errors);
        setStatus({ kind: 'idle' });
        return;
      }
      setStatus({ kind: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' });
    } catch {
      setStatus({ kind: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      data-testid="newsletter-form"
      data-hydrated={hydrated ? 'true' : 'false'}
      className="space-y-5"
    >
      <div>
        <label htmlFor="newsletter-email" className="block text-sm font-medium">
          Adresse e-mail
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? 'newsletter-email-error' : undefined}
          className="mt-1 w-full rounded border border-gray-400 px-3 py-2"
        />
        {fieldErrors.email && (
          <p id="newsletter-email-error" role="alert" data-testid="newsletter-error-email" className="mt-1 text-sm text-red-800">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Thématiques (optionnel)</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {TOPICS.map((topic) => (
            <label key={topic.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="topics" value={topic.slug} />
              {topic.label}
            </label>
          ))}
        </div>
        {fieldErrors.topics && (
          <p role="alert" data-testid="newsletter-error-topics" className="mt-1 text-sm text-red-800">
            {fieldErrors.topics}
          </p>
        )}
      </fieldset>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            aria-invalid={fieldErrors.consent ? true : undefined}
            aria-describedby={fieldErrors.consent ? 'newsletter-consent-error' : undefined}
            className="mt-1"
          />
          <span>J’accepte de recevoir la newsletter de Nous AI News et je peux me désinscrire à tout moment.</span>
        </label>
        {fieldErrors.consent && (
          <p id="newsletter-consent-error" role="alert" data-testid="newsletter-error-consent" className="mt-1 text-sm text-red-800">
            {fieldErrors.consent}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status.kind === 'pending'}
        className="rounded bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {status.kind === 'pending' ? 'Envoi…' : 'S’inscrire'}
      </button>

      <div role="status" aria-live="polite" data-testid="newsletter-status" className="min-h-6 text-sm">
        {status.kind === 'success' && <p className="font-medium text-green-900">{status.message}</p>}
        {status.kind === 'error' && <p className="font-medium text-red-800">{status.message}</p>}
      </div>
    </form>
  );
}
