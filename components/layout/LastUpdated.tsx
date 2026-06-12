'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface StatusData {
  lastRefresh: string | null;
  runNumber?: number;
  url?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function LastUpdated() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = () => {
      fetch('/api/status')
        .then((r) => r.json())
        .then((d) => {
          if (!mounted) return;
          if (d.ok) {
            setData(d);
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch(() => {
          if (mounted) setError(true);
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000); // refresh every 60s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (error) return null;
  if (!data || !data.lastRefresh) return null;

  return (
    <a
      href={data.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors ml-3"
      title={`Last refresh: ${new Date(data.lastRefresh).toLocaleString()} (run #${data.runNumber})`}
    >
      <Clock className="h-3 w-3" />
      <span>Updated {formatTime(data.lastRefresh)}</span>
    </a>
  );
}
