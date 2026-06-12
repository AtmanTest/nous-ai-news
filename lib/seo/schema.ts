interface ArticleJsonLd {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  author: string;
  category?: string;
  tags?: string[];
  updatedAt?: string;
}

export function jsonLdArticle(article: ArticleJsonLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    url: article.url,
    ...(article.imageUrl ? { image: article.imageUrl } : {}),
    datePublished: article.publishedAt,
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: {
      '@type': 'Organization',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Daily AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://daily-ai.vercel.app/favicon.ico',
      },
    },
    ...(article.category ? { articleSection: article.category } : {}),
    ...(article.tags && article.tags.length > 0 ? { keywords: article.tags.join(', ') } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

export function jsonLdBreadcrumb(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Daily AI',
    url: 'https://daily-ai.vercel.app',
    description: 'Premium international AI news platform covering models, research, business, policy, and open source.',
    sameAs: [],
  };
}
