import { describe, expect, it } from 'vitest';
import { createMemoryStore, getDefaultStore, subscribe } from '@/modules/newsletter/service';
import { validateSubscription } from '@/modules/newsletter/validation';

function input(email: string, topics: string[] = []) {
  const result = validateSubscription({ email, consent: true, topics });
  if (!result.ok) throw new Error('fixture invalide');
  return result.value;
}

describe('[REQ-NEW-01] subscribe — inscription', () => {
  it('inscrit une nouvelle adresse et la mémorise', () => {
    const store = createMemoryStore();
    expect(subscribe(input('nouveau@example.com'), store)).toEqual({ status: 'subscribed', email: 'nouveau@example.com' });
    expect(store.has('nouveau@example.com')).toBe(true);
    expect(store.size()).toBe(1);
  });

  it('horodate l’inscription avec l’horloge injectée (déterminisme)', () => {
    const subscribers: Array<{ subscribedAt: string }> = [];
    const store = { has: () => false, add: (s: { subscribedAt: string }) => void subscribers.push(s), size: () => 0 };
    subscribe(input('a@b.fr'), store, () => new Date('2026-10-08T12:00:00Z'));
    expect(subscribers[0]?.subscribedAt).toBe('2026-10-08T12:00:00.000Z');
  });
});

describe('[REQ-NEW-03] subscribe — transitions d’état', () => {
  // Table de transitions : (état courant, événement) → (état suivant, statut renvoyé)
  it('inconnue --subscribe--> subscribed --subscribe--> already_subscribed (sans nouvel enregistrement)', () => {
    const store = createMemoryStore();
    const first = subscribe(input('etat@example.com'), store);
    const second = subscribe(input('etat@example.com'), store);
    const third = subscribe(input('etat@example.com'), store);

    expect([first.status, second.status, third.status]).toEqual(['subscribed', 'already_subscribed', 'already_subscribed']);
    expect(store.size()).toBe(1);
  });

  it('la casse et les espaces ne créent pas de doublon (normalisation avant stockage)', () => {
    const store = createMemoryStore();
    subscribe(input('Casse@Example.com'), store);
    expect(subscribe(input('  casse@example.COM '), store).status).toBe('already_subscribed');
    expect(store.size()).toBe(1);
  });

  it('des adresses différentes sont indépendantes', () => {
    const store = createMemoryStore();
    subscribe(input('un@example.com'), store);
    expect(subscribe(input('deux@example.com'), store).status).toBe('subscribed');
    expect(store.size()).toBe(2);
  });
});

describe('[REQ-NEW-01] store par défaut', () => {
  it('est un singleton partagé par le processus', () => {
    expect(getDefaultStore()).toBe(getDefaultStore());
  });
});
