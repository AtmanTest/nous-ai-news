'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface HeroImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function HeroImage({ src, alt = '', className = '' }: HeroImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-center justify-center ${className}`}>
        <ImageOff className="h-full w-full text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
