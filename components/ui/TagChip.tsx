export function TagChip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-[13px] font-medium hover:bg-primary/20 transition-colors cursor-pointer"
    >
      {label}
    </span>
  );
}
