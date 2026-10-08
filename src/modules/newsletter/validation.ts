import { fail, ok, type FieldError, type Result } from '@/lib/result';
import { CATEGORY_SLUGS, isCategorySlug, type CategorySlug } from '@/modules/topics/topics';

export const MAX_EMAIL_LENGTH = 254;
export const MAX_LOCAL_PART_LENGTH = 64;

export interface SubscriptionInput {
  /** E-mail normalisé : trim + minuscules. */
  email: string;
  consent: true;
  topics: CategorySlug[];
}

/**
 * Validation volontairement pragmatique (sous-ensemble strict de la RFC 5322, ASCII uniquement) :
 *  - partie locale : « dot-atom » (caractères atext séparés par des points, ni point initial/final/double) ;
 *  - domaine : au moins deux labels DNS (1–63 car., alphanumériques et tirets non initiaux/finaux),
 *    TLD alphabétique d'au moins 2 lettres (ou punycode « xn-- »).
 * Hors périmètre : formes entre guillemets, adresses internationalisées (EAI), IP littérales.
 */
const LOCAL_PATTERN = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD_PATTERN = /^([a-z]{2,}|xn--[a-z0-9-]+)$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidDomain(domain: string): boolean {
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1] as string;
  const subdomains = labels.slice(0, -1);
  return subdomains.every((label) => DOMAIN_LABEL_PATTERN.test(label)) && tld.length <= 63 && TLD_PATTERN.test(tld);
}

export function validateEmail(value: unknown): FieldError | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return { field: 'email', message: "L'adresse e-mail est requise." };
  }
  const email = normalizeEmail(value);
  if (email.length > MAX_EMAIL_LENGTH) {
    return { field: 'email', message: `L'adresse e-mail ne doit pas dépasser ${MAX_EMAIL_LENGTH} caractères.` };
  }

  const at = email.indexOf('@');
  if (at <= 0 || at !== email.lastIndexOf('@')) {
    return { field: 'email', message: "Le format de l'adresse e-mail est invalide." };
  }
  const localPart = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (localPart.length > MAX_LOCAL_PART_LENGTH) {
    return { field: 'email', message: `La partie locale ne doit pas dépasser ${MAX_LOCAL_PART_LENGTH} caractères.` };
  }
  if (!LOCAL_PATTERN.test(localPart) || !isValidDomain(domain)) {
    return { field: 'email', message: "Le format de l'adresse e-mail est invalide." };
  }
  return null;
}

/**
 * Valide un corps de requête d'inscription. Collecte toutes les erreurs (table de décision) :
 * email valide × consentement donné × thématiques valides.
 */
export function validateSubscription(input: unknown): Result<SubscriptionInput> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return fail([{ field: 'body', message: 'Le corps de la requête doit être un objet JSON.' }]);
  }

  const body = input as Record<string, unknown>;
  const errors: FieldError[] = [];

  const emailError = validateEmail(body.email);
  if (emailError) errors.push(emailError);

  if (body.consent !== true) {
    errors.push({ field: 'consent', message: 'Le consentement est obligatoire pour recevoir la newsletter.' });
  }

  let topics: CategorySlug[] = [];
  if (body.topics !== undefined) {
    if (!Array.isArray(body.topics) || !body.topics.every(isCategorySlug)) {
      errors.push({
        field: 'topics',
        message: `topics doit être une liste d'identifiants parmi : ${CATEGORY_SLUGS.join(', ')}.`,
      });
    } else {
      topics = Array.from(new Set(body.topics));
    }
  }

  if (errors.length > 0) return fail(errors);

  return ok({ email: normalizeEmail(body.email as string), consent: true, topics });
}
