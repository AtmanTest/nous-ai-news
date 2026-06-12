export interface SocialPost {
  id: string;
  source: 'hackernews' | 'reddit' | 'x' | 'youtube' | 'producthunt';
  url: string;
  title: string;
  text?: string;
  author: string;
  score: number;
  comments: number;
  timestamp: string;
  tags: string[];
  external_url?: string;
  thumbnail_url?: string;
}

export interface SocialSignal {
  posts: SocialPost[];
  trending_topics: { topic: string; mentions: number; momentum: number }[];
  fetched_at: string;
  source: string;
}
