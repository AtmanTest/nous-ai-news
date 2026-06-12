import { cn } from '@/lib/utils';

interface SourceAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SourceAvatar({ src, name, size = 'md' }: SourceAvatarProps) {
  const sizeClass = { sm: 'w-6 h-6 text-[10px]', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AI';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Source'}
        className={cn('rounded-full object-cover shrink-0', sizeClass[size])}
      />
    );
  }

  return (
    <div className={cn('rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0', sizeClass[size])}>
      {initials}
    </div>
  );
}
