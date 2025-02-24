// src/app/farmers/[id]/visits/[visitId]/page.tsx
'use client';

import { useState } from 'react';
import { useMockData } from '@/lib/mock-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clipboard,
  ListChecks,
  Circle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function VisitDetailPage() {
  const router = useRouter();
  const { visitId } = useParams<{ id: string; visitId: string }>();
  const { getFarmerById, getVisitById } = useMockData();
  const visit = getVisitById(visitId);
  const farmer = visit ? getFarmerById(visit.farmerId) : null;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!visit || !farmer) {
    return <div>Visit not found</div>;
  }

  const hasImages = visit.images.length > 0;
  const hasMultipleImages = visit.images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === visit.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? visit.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Visit Details - {farmer.name}</h1>
          <p className="text-muted-foreground">{farmer.village}</p>
        </div>
      </div>

      {hasImages && (
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video">
              <Image
                src={visit.images[currentImageIndex]}
                alt={`Visit photo ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                width={100}
                height={100}
              />
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {visit.images.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex
                            ? 'bg-white'
                            : 'bg-white/50'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        e
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Visit Information</h2>
            </div>
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Visit Date</span>
                <span>{new Date(visit.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Next Visit</span>
                <span>
                  {new Date(visit.nextVisitDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Crop Health</span>
                <span className="flex items-center gap-2">
                  <Circle
                    className={`h-3 w-3 ${
                      visit.cropHealth === 'good'
                        ? 'text-green-500'
                        : visit.cropHealth === 'average'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  />
                  {visit.cropHealth.charAt(0).toUpperCase() +
                    visit.cropHealth.slice(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clipboard className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Notes</h2>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {visit.notes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Recommendations</h2>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {visit.recommendations}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
