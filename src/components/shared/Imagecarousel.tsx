import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }

    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grabbing';
    }
    setTouchStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStart !== null) {
      setTouchEnd(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No images</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      <div
        ref={carouselRef}
        className="aspect-video relative cursor-grab"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[currentIndex]}
          alt={`Visit image ${currentIndex + 1}`}
          fill
          priority={currentIndex === 0}
          className="object-contain"
        />
        {/* Image counter indicator */}
        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-1 text-white text-xs">
          {currentIndex + 1}/{images.length}
        </div>
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full h-8 w-8"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full h-8 w-8"
            onClick={handleNext}
            disabled={currentIndex === images.length - 1}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="flex justify-center mt-2 gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                currentIndex === index ? 'bg-primary' : 'bg-gray-300'
              )}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
