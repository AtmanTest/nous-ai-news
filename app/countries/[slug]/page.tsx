import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

const countryNames: Record<string, string> = {
  us: 'United States',
  cn: 'China',
  eu: 'Europe',
  uk: 'United Kingdom',
  fr: 'France',
  jp: 'Japan',
  de: 'Germany',
  kr: 'South Korea',
  il: 'Israel',
  ca: 'Canada',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = countryNames[slug] || slug.toUpperCase();
  return {
    title: `${name} — AI News`,
    description: `Latest AI news from ${name}. Coverage of AI developments, policy, and startups.`,
  };
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const countryName = countryNames[slug] || slug.toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{countryName}</h1>
          <p className="text-muted-foreground">AI news coverage from {countryName}</p>
        </div>
      </div>

      {/* Placeholder articles */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Link
            key={i}
            href={`/article/sample-${i}`}
            className="block p-4 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {countryName}
              </span>
              <span>{i}h ago</span>
            </div>
            <h2 className="font-semibold">AI News from {countryName} — Article {i}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
