import { getTopicLabel, type CategorySlug } from '@/modules/topics/topics';

/** Couleurs par thématique (contrastes ≥ 4.5:1 en clair comme en sombre). */
const STYLES: Record<CategorySlug, string> = {
  models: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-200',
  research: 'bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200',
  'open-source': 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  policy: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  business: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200',
  agents: 'bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200',
};

export function categoryClasses(category: CategorySlug): string {
  return `inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[category]}`;
}

export function CategoryBadge({ category }: { category: CategorySlug }) {
  return (
    <p data-testid="article-category" data-category={category} className={categoryClasses(category)}>
      {getTopicLabel(category)}
    </p>
  );
}
