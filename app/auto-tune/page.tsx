import { Metadata } from 'next';
import { Activity, GitCommit, Sparkles, Bug, Shield, TestTube, TrendingUp, Bell, Cpu, Zap, RefreshCw, Rocket, Brain, Zap as ZapIcon, Layers } from 'lucide-react';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Auto Evolve | Daily AI',
  description: 'The self-improving engine — while you sleep, the product observes, tests, fixes, and ships improvements autonomously.',
};

function loadData(file: string) {
  try {
    const p = path.join(process.cwd(), 'data', file);
    if (!fs.existsSync(p)) return null;
    const content = fs.readFileSync(p, 'utf8');
    return JSON.parse(content);
  } catch { return null; }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Card({ title, icon: Icon, children, className = '' }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/50 bg-card p-5 sm:p-6 ${className}`}>
      <h2 className="flex items-center gap-2 text-base font-bold mb-4 text-primary">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: any; trend?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {trend && <span className="ml-auto text-green-400 text-[10px] font-medium">{trend}</span>}
      </div>
      <div className="text-2xl sm:text-3xl font-bold">{value}</div>
    </div>
  );
}

export default function AutoEvolvePage() {
  const changelog = loadData('auto-tune-changelog.json');
  const trending = loadData('trending_topics.json');
  const news = loadData('news.json');

  const entries = changelog?.entries || [];
  const trendingTopics = trending?.topics || [];
  const newsCount = news?.total || 0;
  const lastUpdate = news?.updatedAt || '';

  const jobs = [
    { id: 'news-watcher', name: '📡 AI/LLM/IoT Watch', schedule: 'Every 4h', icon: Cpu, status: 'active', lastRun: lastUpdate || 'Never' },
    { id: 'ux-audit', name: '🔍 UX & Perf Audit', schedule: 'Daily 06:00 UTC', icon: Activity, status: 'active', lastRun: 'Pending' },
    { id: 'bug-fixer', name: '🐛 Bug Scan & Auto-Fix', schedule: 'Daily 06:00 UTC', icon: Bug, status: 'active', lastRun: 'Pending' },
    { id: 'test-generator', name: '🧪 Test Generation', schedule: 'Daily 06:00 UTC', icon: TestTube, status: 'active', lastRun: 'Pending' },
    { id: 'feature-planner', name: '🚀 Feature Planning', schedule: 'Mon 09:00 UTC', icon: Sparkles, status: 'active', lastRun: 'Pending' },
    { id: 'deploy', name: '🚀 Vercel Auto-Deploy', schedule: 'After fix + tests pass', icon: Rocket, status: 'active', lastRun: 'Pending' },
  ];

  const stats = [
    { label: 'Sources Monitored', value: '10', icon: Cpu },
    { label: 'Articles Collected', value: newsCount.toLocaleString(), icon: TrendingUp },
    { label: 'Trending Topics', value: trendingTopics.length, icon: Activity },
    { label: 'Evolve Actions', value: entries.length, icon: ZapIcon },
  ];

  const pipelineStages = [
    {
      icon: Cpu,
      color: 'text-blue-400',
      title: 'Data Collection',
      desc: '10 RSS sources scraped every 4h → classified by LLM → stored in Supabase',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Brain,
      color: 'text-purple-400',
      title: 'Intelligent Analysis',
      desc: 'Trending detection → entity extraction → relevance scoring → topic clustering',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Bug,
      color: 'text-red-400',
      title: 'Auto Bug Detection & Fix',
      desc: 'ESLint + TS scan → LLM auto-patch → regression test generation → validation',
      bg: 'bg-red-500/10'
    },
    {
      icon: TestTube,
      color: 'text-green-400',
      title: 'Test Generation',
      desc: 'Unit + E2E tests auto-generated for every change → TNR gate before deploy',
      bg: 'bg-green-500/10'
    },
    {
      icon: Sparkles,
      color: 'text-purple-400',
      title: 'Feature Planning',
      desc: 'Weekly LLM-driven roadmap → GitHub Issues → implementation → changelog',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Rocket,
      color: 'text-orange-400',
      title: 'Continuous Deploy',
      desc: 'Vercel preview → integration tests → production promote → rollback on failure',
      bg: 'bg-orange-500/10'
    },
  ];

  return (
    <>
      {/* Sticky Hero */}
      <div className="sticky top-0 z-30 bg-background/65 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 h-[53px]">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Auto Evolve</h1>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span suppressHydrationWarning>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Marketing Hero */}
        <section className="mb-8 sm:mb-12 text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="text-foreground">The Self-Improving </span>
            <span className="text-primary">Engine</span>
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto sm:mx-0">
            While you sleep, the product observes, tests, fixes, and ships improvements —
            autonomously. No human in the loop required.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 justify-center sm:justify-start">
            <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Continuous CI/CD</Badge>
            <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">Auto Test Generation</Badge>
            <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20">LLM-Driven Bug Fixes</Badge>
            <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20">Weekly Feature Planning</Badge>
            <Badge className="bg-gray-500/10 text-gray-400 border border-gray-500/20">Vercel Auto-Deploy</Badge>
            <Badge className="bg-pink-500/10 text-pink-400 border border-pink-500/20">Zero Human Ops</Badge>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
          ))}
        </div>

        {/* Pipeline - The Engine */}
        <section className="mb-8">
          <h3 className="flex items-center gap-2 text-lg font-bold text-primary mb-5">
            <Layers className="h-5 w-5" />
            The Evolution Pipeline
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {pipelineStages.map((stage, i) => (
              <div key={stage.title} className={`rounded-xl border p-4 sm:p-5 ${stage.bg} border-border/20 hover:border-primary/30 transition-colors`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stage.bg} border ${stage.bg.replace('bg-', 'border-').replace('/10', '')}`}>
                    <stage.icon className={`h-5 w-5 ${stage.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{stage.title}</h4>
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mt-1" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Jobs + Trending + Action Log */}
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Active Jobs */}
            <div className="lg:col-span-1">
              <Card title="Active Jobs" icon={Activity}>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="rounded-lg border border-border/30 bg-muted/30 p-3.5 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{job.name}</span>
                        <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                          job.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${job.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                          {job.status}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        <div>Schedule: {job.schedule}</div>
                        <div>Last run: {job.lastRun}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Trending Topics */}
            <div className="lg:col-span-1">
              <Card title="Trending Topics" icon={TrendingUp}>
                {trendingTopics.length > 0 ? (
                  <div className="space-y-2">
                    {trendingTopics.map((t: any, i: number) => (
                      <div key={t.topic} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                          <span className="truncate max-w-[140px]">{t.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, t.weight)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right font-medium">{t.weight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Waiting for first scan...</p>
                )}
                {trending?.updatedAt && (
                  <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/20">
                    Updated {formatTime(trending.updatedAt)}
                  </p>
                )}
              </Card>
            </div>

            {/* Action Log */}
            <div className="lg:col-span-1">
              <Card title="Evolution Log" icon={GitCommit}>
                {entries.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {entries.slice(0, 30).map((e: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs py-2 border-b border-border/10 last:border-0">
                        <div className="mt-0.5 flex-shrink-0">
                          {e.type === 'bug-fix' ? <Bug className="h-3.5 w-3.5 text-red-400" /> :
                           e.type === 'ux-audit' ? <Activity className="h-3.5 w-3.5 text-blue-400" /> :
                           e.type === 'test-generation' ? <TestTube className="h-3.5 w-3.5 text-green-400" /> :
                           e.type === 'feature-planning' ? <Sparkles className="h-3.5 w-3.5 text-purple-400" /> :
                           <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate">{e.summary || e.type}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>{formatTime(e.timestamp)}</span>
                            {e.runId !== 'local' && <span>run #{e.runId?.slice(0, 6)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No actions yet. Auto Evolve runs on schedule.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pb-6 text-center text-xs text-muted-foreground border-t border-border/20 pt-6">
          <p className="font-medium">Auto Evolve v1.0</p>
          <p className="mt-1">Running on GitHub Actions · Powered by NVIDIA Nim API · Zero Human Ops</p>
        </div>
      </div>
    </>
  );
}