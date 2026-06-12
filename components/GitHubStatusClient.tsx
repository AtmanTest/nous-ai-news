'use client';

import { useEffect, useState } from 'react';
import { GitCommit, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

interface WorkflowRun {
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getStatusIcon(conclusion: string | null, status: string) {
  if (conclusion === 'success') return <CheckCircle2 className="h-3 w-3 text-green-500" />;
  if (conclusion === 'failure') return <XCircle className="h-3 w-3 text-red-500" />;
  if (status === 'in_progress') return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
  if (status === 'queued' || status === 'pending') return <Clock className="h-3 w-3 text-yellow-500" />;
  return <AlertTriangle className="h-3 w-3 text-gray-500" />;
}

function getStatusText(conclusion: string | null, status: string) {
  if (conclusion === 'success') return 'Success';
  if (conclusion === 'failure') return 'Failed';
  if (conclusion === 'cancelled') return 'Cancelled';
  if (conclusion === 'skipped') return 'Skipped';
  if (status === 'in_progress') return 'Running';
  if (status === 'queued' || status === 'pending') return 'Queued';
  return status;
}

function CardWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-base font-bold mb-4">
        <GitCommit className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export function GitHubStatusClient() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [commitsRes, workflowsRes] = await Promise.all([
          fetch('https://api.github.com/repos/AtmanTest/nous-ai-news/commits?per_page=5', {
            headers: { Accept: 'application/vnd.github.v3+json' },
          }),
          fetch('https://api.github.com/repos/AtmanTest/nous-ai-news/actions/runs?per_page=5&branch=main', {
            headers: { Accept: 'application/vnd.github.v3+json' },
          }),
        ]);

        if (cancelled) return;

        if (!commitsRes.ok) throw new Error(`GitHub commits: ${commitsRes.status}`);
        if (!workflowsRes.ok) throw new Error(`GitHub workflows: ${workflowsRes.status}`);

        const commitsData = await commitsRes.json();
        const workflowsData = await workflowsRes.json();

        setCommits(
          commitsData.map((c: any) => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split('\n')[0],
            date: c.commit.author?.date || c.commit.committer?.date,
            author: c.commit.author?.name || 'Unknown',
          }))
        );

        setWorkflows(workflowsData.workflow_runs || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <CardWrapper title="GitHub Status">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      </CardWrapper>
    );
  }

  if (error) {
    return (
      <CardWrapper title="GitHub Status">
        <div className="text-center py-4 text-sm text-red-500">
          Failed to load GitHub data: {error}
          <br />
          <a href="https://github.com/AtmanTest/nous-ai-news/actions" target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2 inline-block">
            View on GitHub Actions →
          </a>
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper title="GitHub Status">
      {/* Recent Commits */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Recent Commits</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {commits.slice(0, 5).map((commit, i) => (
            <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <GitCommit className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-primary">{commit.sha}</code>
                  <span className="text-muted-foreground">{timeAgo(commit.date)}</span>
                </div>
                <div className="text-foreground truncate ml-6">{commit.message}</div>
                <div className="text-xs text-muted-foreground ml-6">by {commit.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workflow Runs */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Recent Workflow Runs (main)</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {workflows.slice(0, 5).map((run, i) => (
            <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="flex-shrink-0">{getStatusIcon(run.conclusion, run.status)}</span>
                <div className="truncate font-mono text-sm">{run.name || 'Unknown workflow'}</div>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className={`capitalize text-xs font-medium ${
                  run.conclusion === 'success' ? 'text-green-500' :
                  run.conclusion === 'failure' ? 'text-red-500' :
                  run.status === 'in_progress' ? 'text-primary' :
                  'text-yellow-500'
                }`}>
                  {getStatusText(run.conclusion, run.status)}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">{timeAgo(run.created_at)}</span>
                <a href={run.html_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex-shrink-0">
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-border/30 text-xs text-muted-foreground text-center">
        <a href="https://github.com/AtmanTest/nous-ai-news/actions" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
          Full history on GitHub Actions →
        </a>
      </div>
    </CardWrapper>
  );
}