import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import * as Sentry from "@sentry/nextjs";
import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import { I18nClientProvider } from "@/components/i18n/ClientProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: "variable",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "variable",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Daily AI — Global AI Coverage",
    template: "%s | Daily AI",
  },
  description:
    "Premium international AI news platform covering models, research, business, policy, and open source. Real-time curated AI news from global sources.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Daily AI",
    title: "Daily AI — Global AI Coverage",
    description:
      "Premium international AI news platform covering models, research, business, policy, and open source.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily AI — Global AI Coverage",
    description:
      "Premium international AI news platform covering models, research, business, policy, and open source.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { AuthProvider } from "@/contexts/AuthContext";
import PWARegister from "@/components/PWARegister";
import { PostHogAnalyticsProvider } from "@/lib/posthog";

// Dynamic imports with SSR disabled for client-only components
const PWAInstallPrompt = dynamic(() => import("@/components/PWAInstallPrompt"), {
  ssr: false,
  loading: () => null,
});

const PWAUpdateBanner = dynamic(() => import("@/components/PWAUpdateBanner"), {
  ssr: false,
  loading: () => null,
});

const LiveUpdatesBadge = dynamic(
  () => import("@/hooks/useLiveUpdates").then((m) => ({ default: m.LiveUpdatesBadge })),
  {
    ssr: false,
    loading: () => null,
  }
);

const themeScript = `
(function() {
  var theme = localStorage.getItem('nous-news-theme');
  if (!theme || theme === 'system') theme = 'dark';
  document.documentElement.classList.remove('dark', 'dim', 'light');
  document.documentElement.classList.add(theme);
})();
`;

// Sentry error boundary wrapper
function SentryBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              We've captured this error and our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Reload page
            </button>
          </div>
        </div>
      }
      onReset={(error: unknown, componentStack: string, eventId: string) => {
        Sentry.addBreadcrumb({
          category: "error-boundary",
          message: "Error boundary reset",
          level: "info",
        });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

// Async function to get locale and messages
async function getLocaleAndMessages() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const validLocale = cookieLocale && routing.locales.includes(cookieLocale as any)
    ? cookieLocale
    : routing.defaultLocale;

  // Import messages dynamically
  const messages = (await import(`@/messages/${validLocale}.json`)).default;

  return { locale: validLocale, messages };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getLocaleAndMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Nous AI News" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nous AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <I18nClientProvider locale={locale} messages={messages}>
          <ThemeProvider defaultTheme="dark" storageKey="nous-news-theme">
            <PostHogAnalyticsProvider>
              <AuthProvider>
                <AppLayout>
                  <SentryBoundary>{children}</SentryBoundary>
                </AppLayout>
              </AuthProvider>
            </PostHogAnalyticsProvider>
          </ThemeProvider>
          <PWARegister />
          <PWAInstallPrompt />
          <PWAUpdateBanner />
          <LiveUpdatesBadge />
        </I18nClientProvider>
      </body>
    </html>
  );
}