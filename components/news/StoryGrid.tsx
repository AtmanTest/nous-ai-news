import { StoryCard } from './StoryCard';

interface Story {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  category: string;
  published_at: string;
  slug: string;
  is_featured?: boolean;
  is_breaking?: boolean;
}

interface StoryGridProps {
  stories: Story[];
  title?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'horizontal';
  columns?: 2 | 3 | 4;
}

export function StoryGrid({
  stories,
  title,
  description,
  variant = 'default',
  columns = 3,
}: StoryGridProps) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      )}

      {variant === 'horizontal' ? (
        <div className="space-y-2">
          {stories.map((story) => (
            <StoryCard key={story.id} {...story} variant="list" />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
          {stories.map((story) => (
            <StoryCard key={story.id} {...story} variant={variant} />
          ))}
        </div>
      )}
    </section>
  );
}
