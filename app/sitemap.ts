import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://daily-ai.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'hourly' as const, priority: 1.0 },
    { url: `${BASE_URL}/trending`, lastModified: new Date(), changeFrequency: 'hourly' as const, priority: 0.9 },
    { url: `${BASE_URL}/bookmarks`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.3 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${BASE_URL}/profile`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
  ];

  const topicRoutes = [
    'models', 'research', 'business', 'policy', 'open-source', 'startups', 'hardware', 'agents', 'safety',
  ].map((slug) => ({
    url: `${BASE_URL}/topics/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const countryRoutes = [
    'us', 'cn', 'eu', 'uk', 'fr', 'jp', 'de', 'kr', 'il', 'ca',
  ].map((slug) => ({
    url: `${BASE_URL}/countries/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...topicRoutes, ...countryRoutes];
}
