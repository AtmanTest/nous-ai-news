const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Date longue en français, fuseau UTC fixe pour un rendu identique serveur/client/CI. */
export function formatDateFr(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatReading(minutes: number): string {
  return `${minutes} min de lecture`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count > 1 ? plural : singular}`;
}
