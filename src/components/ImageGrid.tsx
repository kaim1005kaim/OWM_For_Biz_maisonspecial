'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageItem {
  id: string;
  url: string;
  thumbUrl?: string | null;
  title?: string;
  tags?: string[];
  caption?: string;
  silhouette?: string;
  material?: string;
  mood?: string;
}

interface ImageGridProps {
  images: ImageItem[];
  onSelect?: (id: string) => void;
  selectedIds?: string[];
  showDetails?: boolean;
  columns?: 3 | 4 | 5 | 6;
}

export default function ImageGrid({
  images,
  onSelect,
  selectedIds = [],
  showDetails = true,
  columns = 4,
}: ImageGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {images.map((image) => {
        const isSelected = selectedIds.includes(image.id);
        const isHovered = hoveredId === image.id;

        return (
          <div
            key={image.id}
            className={`relative group cursor-pointer ${
              isSelected ? 'ring-2 ring-[var(--accent-cyan)]' : ''
            }`}
            onClick={() => onSelect?.(image.id)}
            onMouseEnter={() => setHoveredId(image.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Image */}
            <div className="aspect-[3/4] relative overflow-hidden bg-[var(--background-card)]">
              <Image
                src={image.thumbUrl || image.url}
                alt={image.title || 'Image'}
                fill
                className="object-cover image-hover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--accent-cyan)] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Hover Overlay */}
              {showDetails && isHovered && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end fade-in">
                  {image.title && (
                    <h3 className="text-sm font-medium mb-1 line-clamp-1">
                      {image.title}
                    </h3>
                  )}
                  {image.caption && (
                    <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
                      {image.caption}
                    </p>
                  )}
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {image.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag-chip text-[10px]">
                          {tag}
                        </span>
                      ))}
                      {image.tags.length > 3 && (
                        <span className="tag-chip text-[10px]">
                          +{image.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Info Bar */}
            {showDetails && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                {image.silhouette && <span>{image.silhouette}</span>}
                {image.material && <span>•</span>}
                {image.material && <span>{image.material}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
