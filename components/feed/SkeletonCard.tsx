export function SkeletonCard() {
  return (
    <div className="px-4 py-3 border-b border-border/40 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-accent shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-accent rounded" />
          <div className="h-3 w-20 bg-accent rounded" />
        </div>
      </div>
      <div className="space-y-2 ml-[52px]">
        <div className="h-4 w-full bg-accent rounded" />
        <div className="h-4 w-3/4 bg-accent rounded" />
        <div className="h-4 w-5/6 bg-accent rounded mb-3" />
        <div className="aspect-[16/9] bg-accent rounded-2xl mb-2" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 bg-accent rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
