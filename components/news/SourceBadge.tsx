import { cn } from '@/lib/utils';

interface SourceBadgeProps {
  name: string;
  type?: 'rss' | 'api' | 'social' | 'newsapi';
  tier?: number;
  className?: string;
}

export function SourceBadge({ name, type, tier, className }: SourceBadgeProps) {
  const tierColors = {
    1: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    2: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    3: 'bg-green-500/10 text-green-500 border-green-500/20',
    4: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    5: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
        tier ? tierColors[tier as keyof typeof tierColors] || tierColors[5] : 'bg-secondary/50 text-muted-foreground',
        className
      )}
    >
      {type === 'rss' && <span className="text-[10px]">📡</span>}
      {type === 'api' && <span className="text-[10px]">🔌</span>}
      {type === 'social' && <span className="text-[10px]">💬</span>}
      {name}
    </span>
  );
}
