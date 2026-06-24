import Link from 'next/link';

const footerLinks = {
  Topics: [
    { href: '/trending', label: 'Trending' },
    { href: '/topics/models', label: 'AI Models' },
    { href: '/topics/research', label: 'Research' },
    { href: '/topics/business', label: 'Business' },
    { href: '/topics/policy', label: 'Policy & Regulation' },
    { href: '/topics/open-source', label: 'Open Source' },
    { href: '/topics/startups', label: 'Startups' },
    { href: '/topics/hardware', label: 'Hardware' },
  ],
  Regions: [
    { href: '/countries/us', label: 'United States' },
    { href: '/countries/cn', label: 'China' },
    { href: '/countries/eu', label: 'Europe' },
    { href: '/countries/uk', label: 'United Kingdom' },
    { href: '/countries/fr', label: 'France' },
    { href: '/countries/jp', label: 'Japan' },
  ],
  Company: [
    { href: '/', label: 'About' },
    { href: '/', label: 'Contact' },
    { href: '/', label: 'Privacy' },
    { href: '/', label: 'Terms' },
    { href: '/settings', label: 'Settings' },
    { href: '/auto-tune', label: 'Auto Evolve' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="font-bold text-lg">Daily AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Premium international AI news coverage. Curated, ranked, and delivered in real-time.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-sm mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.07] px-8 py-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Daily AI. All rights reserved.
          </p>

          <div className="text-sm text-muted-foreground">
            Thinked by Thasin Jahangir, Made wityh love with AI — <Link href="https://www.linkedin.com/in/thasin-j-47582635/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
