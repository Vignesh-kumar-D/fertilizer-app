'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FullScreenImageViewer } from './FullScreenImageViewer';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  width?: number;
  height?: number;
}

export function ImageCarousel({
  images,
  className,
  aspectRatio = 'video',
  width = 500,
  height = 500,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Handle empty image array
  if (!images.length) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-md bg-muted flex items-center justify-center',
          aspectRatio === 'square' && 'aspect-square',
          aspectRatio === 'video' && 'aspect-video',
          aspectRatio === 'wide' && 'aspect-[21/9]',
          className
        )}
      >
        <div className="text-muted-foreground text-sm">No images</div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openFullscreen = () => {
    setIsFullscreenOpen(true);
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-md bg-muted',
          aspectRatio === 'square' && 'aspect-square',
          aspectRatio === 'video' && 'aspect-video',
          aspectRatio === 'wide' && 'aspect-[21/9]'
        )}
      >
        <div className="relative h-full w-full">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                index === currentIndex
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              )}
            >
              <Image
                src={image}
                alt={`Product image ${index + 1}`}
                fill
                sizes={`(max-width: 768px) 100vw, ${width}px, ${height}px`}
                className="object-cover cursor-pointer"
                onClick={openFullscreen}
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Fullscreen button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-80 hover:opacity-100 z-10"
          onClick={openFullscreen}
        >
          <Expand className="h-4 w-4" />
        </Button>

        {/* Navigation controls */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white opacity-80 hover:opacity-100 z-10"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white opacity-80 hover:opacity-100 z-10"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail indicators */}
      {images.length > 1 && (
        <div className="flex justify-center mt-2 gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30'
              )}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      <FullScreenImageViewer
        images={images}
        initialIndex={currentIndex}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </div>
  );
}
