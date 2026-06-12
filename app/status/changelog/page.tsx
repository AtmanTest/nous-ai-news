export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Changelog</h1>

      <div className="space-y-6">
        {/* v1.0.0 */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-semibold">v1.0.0 — Initial Release</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Pending deployment</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">Pending</span>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✨ Next.js 14 App Router with 12 routes</li>
            <li>✨ Premium design system with dark mode</li>
            <li>✨ RSS ingestion from 20+ AI sources</li>
            <li>✨ Social signals from HN + Reddit</li>
            <li>✨ Full-text search with filters</li>
            <li>✨ Bookmarks with Supabase backend</li>
            <li>✨ Supabase Auth (email + OAuth)</li>
            <li>✨ i18n support (8 languages)</li>
            <li>✨ SEO metadata, sitemap, schema.org</li>
            <li>✨ AI News Shield cron (4h cycle)</li>
            <li>✨ QA system with TNR gates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
