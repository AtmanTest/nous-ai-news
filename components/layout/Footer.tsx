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

          <div className="relative inline-flex items-center gap-1 text-sm" style={{ color: 'currentColor' }}>
            <span className="relative inline-block" style={{ position: 'relative', cursor: 'default' }}>
              <span className="inline-flex items-center gap-1">
                <span style={{ color: 'var(--color-primary, currentColor)' }}>✦</span>
                <Link
                  href="https://www.linkedin.com/in/thasin-j-47582635/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium transition-colors duration-180"
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
                >
                  Conceived by Jahangir Thasin
                </Link>
                <span style={{ opacity: 0.3 }}> · </span>
                <span
                  className="footer-tooltip-trigger"
                  style={{ position: 'relative', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}
                >
                  Crafted with AI
                </span>
              </span>
            </span>
          </div>

          <Link
            href="https://www.linkedin.com/in/thasin-j-47582635/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1.5 transition-opacity duration-180"
            style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
          >
            💼 Jahangir Thasin
          </Link>
        </div>
      </div>

      <style>{`
        .footer-tooltip-trigger {
          position: relative;
          cursor: default;
        }
        .footer-tooltip-trigger:hover::after {
          content: "Built using Claude AI · Designed for AI enthusiasts worldwide 🌍";
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20,20,30,0.95);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          opacity: 1;
          pointer-events: none;
          transition: opacity 150ms ease;
          z-index: 50;
        }
      `}</style>
    </footer>
  );
}
