import type { CategorySlug } from '@/modules/topics/topics';
import type { SubscriptionInput } from './validation';

export interface Subscriber {
  email: string;
  topics: CategorySlug[];
  subscribedAt: string;
}

export interface SubscriberStore {
  has(email: string): boolean;
  add(subscriber: Subscriber): void;
  size(): number;
}

export type SubscriptionStatus = 'subscribed' | 'already_subscribed';

export function createMemoryStore(): SubscriberStore {
  const subscribers = new Map<string, Subscriber>();
  return {
    has: (email) => subscribers.has(email),
    add: (subscriber) => {
      subscribers.set(subscriber.email, subscriber);
    },
    size: () => subscribers.size,
  };
}

const globalForStore = globalThis as unknown as { __nousSubscriberStore?: SubscriberStore };

/** Store en mémoire partagé par le processus (démo : aucune persistance, aucune donnée réelle). */
export function getDefaultStore(): SubscriberStore {
  globalForStore.__nousSubscriberStore ??= createMemoryStore();
  return globalForStore.__nousSubscriberStore;
}

/**
 * Machine à états par adresse e-mail :
 *   (inconnue) --subscribe--> subscribed
 *   subscribed --subscribe--> already_subscribed (aucun changement d'état : idempotent)
 */
export function subscribe(
  input: SubscriptionInput,
  store: SubscriberStore = getDefaultStore(),
  now: () => Date = () => new Date(),
): { status: SubscriptionStatus; email: string } {
  if (store.has(input.email)) {
    return { status: 'already_subscribed', email: input.email };
  }
  store.add({ email: input.email, topics: input.topics, subscribedAt: now().toISOString() });
  return { status: 'subscribed', email: input.email };
}
