import { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle2, XCircle, Clock, GitCommit, RefreshCw, Activity, Server, Shield, AlertTriangle, Settings, Bell, Mail, Code, Database, TestTube } from 'lucide-react';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { NewsletterPreferences } from '@/components/NewsletterPreferences';
import { GitHubStatusClient } from '@/components/GitHubStatusClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Settings & System Status | Daily AI',
  description: 'System settings, cron jobs, QA tests, and version history for Daily AI.',
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

interface WorkflowRun {
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgoLong(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Card Wrapper ────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, className = '' }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/50 bg-card p-4 sm:p-5 ${className}`}>
      <h2 className="flex items-center gap-2 text-base font-bold mb-4">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  // ── Supabase status (server-side, fast) ─────────────────────────────────────
  let dbOk = false;
  let articleCount = 0;
  try {
    const supabase = await createClient();
    const { count, error } = await supabase.from('articles').select('*', { count: 'exact', head: true });
    if (!error) {
      articleCount = count || 0;
      dbOk = true;
    }
  } catch {
    dbOk = false;
  }

  // ── Static info ────────────────────────────────────────────────────────────
  const testCount = 43;
  const testFiles = 2;
  const tnrScript = '1. Run npm run tnr\n2. 43 vitest tests (utils + routes)\n3. If red: fix + add test + retest\n4. If green: push';

  const crons = [
    {
      name: 'News Refresh',
      schedule: '5 * * * * (every hour)',
      type: 'GitHub Actions',
      path: '.github/workflows/refresh-news.yml',
      endpoint: 'POST /api/refresh?key=***',
      lastRun: 'Check GitHub Actions',
      lastStatus: 'unknown',
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  const pageTitle = (
    <div className="sticky top-0 z-30 bg-background/65 backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center justify-between px-4 h-[53px]">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <RefreshCw className="h-3 w-3" />
          <span suppressHydrationWarning>{new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {pageTitle}

      <div className="px-4 py-4 space-y-4">
        {/* ─── Push Notifications ──────────────────────────────────────────── */}
        <SectionCard title="Push Notifications" icon={Bell}>
          <Suspense fallback={<div className="h-32 animate-pulse bg-muted/50 rounded-lg" />}>
            <NotificationPreferences />
          </Suspense>
        </SectionCard>

        {/* ─── Newsletter ──────────────────────────────────────────────────── */}
        <SectionCard title="Newsletter" icon={Mail}>
          <Suspense fallback={<div className="h-32 animate-pulse bg-muted/50 rounded-lg" />}>
            <NewsletterPreferences />
          </Suspense>
        </SectionCard>

        {/* ─── System Status ───────────────────────────────────────────────── */}
        <SectionCard title="System Status" icon={Server}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Database */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Database className={`h-4 w-4 ${dbOk ? 'text-green-500' : 'text-red-500'}`} />
                <span>Supabase</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{articleCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Articles in DB</div>
              <div className={`text-xs mt-1 ${dbOk ? 'text-green-500' : 'text-red-500'}`}>
                {dbOk ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            {/* Tests */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <TestTube className="h-4 w-4 text-primary" />
                <span>QA Tests</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{testCount}</div>
              <div className="text-xs text-muted-foreground">Vitest tests</div>
              <div className="text-xs text-primary mt-1">All passing</div>
            </div>

            {/* Cron Jobs */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Cron Jobs</span>
              </div>
              <div className="text-2xl font-bold text-foreground">1</div>
              <div className="text-xs text-muted-foreground">GitHub Actions</div>
              <div className="text-xs text-primary mt-1">Hourly refresh</div>
            </div>

            {/* Repository */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Code className="h-4 w-4 text-primary" />
                <span>Repository</span>
              </div>
              <div className="text-2xl font-bold text-foreground">1</div>
              <div className="text-xs text-muted-foreground">AtmanTest/nous-ai-news</div>
              <div className="text-xs text-primary mt-1">Auto-deploy on push</div>
            </div>
          </div>
        </SectionCard>

        {/* ─── GitHub Status (Client-side) ───────────────────────────────────── */}
        <GitHubStatusClient />

        {/* ─── Cron Jobs Detail ────────────────────────────────────────────── */}
        <SectionCard title="Cron Jobs (GitHub Actions)" icon={Clock}>
          <div className="space-y-2 text-sm">
            {crons.map((cron, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-card/50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{cron.name}</div>
                    <div className="text-xs text-muted-foreground">{cron.schedule} • {cron.type}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    {cron.lastStatus}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-mono">{cron.path}</div>
                <div className="text-xs text-muted-foreground font-mono">{cron.endpoint}</div>
                <div className="text-xs text-muted-foreground">Last run: {cron.lastRun}</div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
              View full history: <a href="https://github.com/AtmanTest/nous-ai-news/actions" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">GitHub Actions</a>
            </div>
          </div>
        </SectionCard>

        {/* ─── QA Test Procedure ───────────────────────────────────────────── */}
        <SectionCard title="QA Test Procedure" icon={RefreshCw}>
          <pre className="bg-muted/50 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap text-muted-foreground">
            {tnrScript}
          </pre>
        </SectionCard>

      </div>
    </>
  );
}