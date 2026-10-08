export const metadata = { title: 'Newsletter' };

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
      <p className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">
        L’inscription nécessite un serveur : elle n’est pas disponible sur cette version statique hébergée sur GitHub
        Pages. Le formulaire et son API sont testés dans la version complète (voir le dépôt).
      </p>
    </div>
  );
}
