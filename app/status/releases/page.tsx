export default function ReleasesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Releases</h1>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-muted/30">
              <th className="text-left px-4 py-3 font-medium">Version</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Environment</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/20">
              <td className="px-4 py-3 font-mono text-xs">v1.0.0</td>
              <td className="px-4 py-3 text-muted-foreground">—</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs">Recipe</span>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">Pending</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        Releases are created via GitHub after QA validation.
        Visit <a href="https://github.com/AtmanTest/daily-ai-news/releases" className="text-primary hover:underline" target="_blank">GitHub Releases</a> to see all published versions.
      </p>
    </div>
  );
}
