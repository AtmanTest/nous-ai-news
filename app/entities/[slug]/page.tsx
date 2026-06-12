import { Metadata } from 'next';
import Link from 'next/link';
import { Tag, ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { StoryCard } from '@/components/news/StoryCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, ' ')} — AI News`,
    description: `Latest AI news articles about ${slug.replace(/-/g, ' ')}`,
  };
}

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  category: string | null;
  tags: string[];
  published_at: string;
  score: number;
  is_breaking: boolean;
  content: string | null;
  language: string | null;
}

async function getArticlesForEntity(entityName: string): Promise<Article[]> {
  try {
    const supabase = await createAdminClient();
    // Search articles whose tags or title contain the entity name
    const { data } = await supabase
      .from('articles')
      .select('id, title, summary, image_url, source_name, category, tags, published_at, score, is_breaking, content, language')
      .eq('status', 'published')
      .or(`tags.cs.{${entityName}},title.ilike.%${entityName}%`)
      .order('score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(30);

    return (data || []) as Article[];
  } catch {
    return [];
  }
}

// Known entities for display/directory purposes
const KNOWN_ENTITIES: Record<string, { label: string; type: string; description: string }> = {
  'openai': { label: 'OpenAI', type: 'company', description: 'AI research and deployment company behind GPT, DALL-E, and Sora.' },
  'anthropic': { label: 'Anthropic', type: 'company', description: 'AI safety company behind Claude models.' },
  'google': { label: 'Google DeepMind', type: 'company', description: 'Google\'s AI research lab behind Gemini, AlphaFold.' },
  'meta': { label: 'Meta AI', type: 'company', description: 'Meta\'s AI research division behind LLaMA models.' },
  'microsoft': { label: 'Microsoft AI', type: 'company', description: 'Microsoft\'s AI division behind Copilot and Azure AI.' },
  'nvidia': { label: 'NVIDIA', type: 'company', description: 'GPU manufacturer and AI computing leader.' },
  'mistral': { label: 'Mistral AI', type: 'company', description: 'French AI company behind Mistral models.' },
  'huggingface': { label: 'Hugging Face', type: 'company', description: 'ML platform and model hub.' },
  'stability': { label: 'Stability AI', type: 'company', description: 'AI company behind Stable Diffusion.' },
  'xai': { label: 'xAI', type: 'company', description: 'Elon Musk\'s AI company behind Grok.' },
  'cohere': { label: 'Cohere', type: 'company', description: 'Enterprise AI platform specializing in RAG and embeddings.' },
  'apple': { label: 'Apple AI', type: 'company', description: 'Apple\'s AI research division behind Apple Intelligence.' },
  'gpt': { label: 'GPT', type: 'model', description: 'OpenAI\'s Generative Pre-trained Transformer model series.' },
  'claude': { label: 'Claude', type: 'model', description: 'Anthropic\'s AI assistant model.' },
  'gemini': { label: 'Gemini', type: 'model', description: 'Google\'s multimodal AI model.' },
  'llama': { label: 'LLaMA', type: 'model', description: 'Meta\'s open-source large language model.' },
  'sora': { label: 'Sora', type: 'model', description: 'OpenAI\'s text-to-video generation model.' },
  'dalle': { label: 'DALL-E', type: 'model', description: 'OpenAI\'s text-to-image generation model.' },
};

export default async function EntityPage({ params }: Props) {
  const { slug } = await params;
  const entityKey = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  const entity = KNOWN_ENTITIES[entityKey];
  const displayName = entity?.label || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const articles = await getArticlesForEntity(displayName);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Home
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-5 w-5 text-primary" />
          {entity && (
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {entity.type}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{displayName}</h1>
        {entity?.description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{entity.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {articles.length > 0 ? `${articles.length} article${articles.length !== 1 ? 's' : ''}` : 'No articles found'}
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="space-y-1">
          {articles.slice(0, 2).map((article) => (
            <StoryCard
              key={article.id}
              {...article}
              slug={article.id}
              variant="list"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No articles tagged with this entity yet</p>
          <p className="text-sm mt-1">Articles will appear here once ingested with relevant tags.</p>
        </div>
      )}

      {/* Entity directory */}
      {!entity && (
        <div className="mt-12 pt-8 border-t border-border/30">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Browse Known Entities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(KNOWN_ENTITIES).map(([key, ent]) => (
              <Link
                key={key}
                href={`/entities/${key}`}
                className="p-3 rounded-lg border border-border/40 bg-card hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">{ent.type}</div>
                <div className="text-sm font-medium">{ent.label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
