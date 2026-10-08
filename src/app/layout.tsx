import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} — L’actualité de l’IA`, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
