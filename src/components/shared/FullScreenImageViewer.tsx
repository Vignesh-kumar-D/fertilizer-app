'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
interface FullScreenImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function FullScreenImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: FullScreenImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Reset to initialIndex when props change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  const navigateNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  const navigatePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  }, [images.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowLeft') {
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigateNext, navigatePrev, onClose]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      navigateNext();
    } else if (isRightSwipe) {
      navigatePrev();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-labelledby="custom-title"
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none"
      >
        <VisuallyHidden>
          <DialogTitle>Full screen Images</DialogTitle>
        </VisuallyHidden>
        {/* Main flex container */}
        <div className="flex flex-col h-[90vh] w-full relative">
          {/* Top bar with close button */}
          <div className="flex justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Middle section with image and navigation */}
          <div
            className="flex-1 flex items-center justify-center relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left navigation */}
            {images.length > 1 && (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigatePrev}
                  className="m-2 h-12 w-12 text-white hover:bg-white/20 rounded-full z-10"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              </div>
            )}

            {/* Image carousel */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {images.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className={cn(
                    'flex items-center justify-center w-full h-full transition-opacity duration-300',
                    index === currentIndex
                      ? 'opacity-100 flex'
                      : 'opacity-0 hidden'
                  )}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="relative w-auto h-auto max-w-full max-h-full">
                      <Image
                        src={src}
                        alt={`Image ${index + 1}`}
                        className="object-contain"
                        width={1200}
                        height={1200}
                        sizes="95vw, 95vh"
                        priority={index === currentIndex}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right navigation */}
            {images.length > 1 && (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateNext}
                  className="m-2 h-12 w-12 text-white hover:bg-white/20 rounded-full z-10"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>
            )}
          </div>

          {/* Bottom section with counter */}
          <div className="flex justify-center p-4">
            {images.length > 1 && (
              <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
