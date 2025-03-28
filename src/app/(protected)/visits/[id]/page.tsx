// src/app/visits/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-context';
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
  Leaf,
  Loader2,
  User,
  MapPin,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Visit, Farmer } from '@/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { ImageCarousel } from '@/components/shared/Imagecarousel';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

export default function VisitDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { getVisitById, getFarmerById } = useFirebase();

  const [visit, setVisit] = useState<Visit | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [fullscreenView, setFullscreenView] = useState(false);

  // Fetch visit and farmer data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const visitData = await getVisitById(id as string);

        if (!visitData) {
          setError('Visit not found');
          setLoading(false);
          return;
        }

        setVisit(visitData);

        // Fetch farmer data
        const farmerData = await getFarmerById(visitData.farmerId);

        if (!farmerData) {
          setError('Farmer information not found');
        } else {
          setFarmer(farmerData);
        }
      } catch (err) {
        console.error('Error fetching visit details:', err);
        setError('Failed to load visit details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, getVisitById, getFarmerById]);

  // Image carousel touch/swipe handlers

  // Image navigation functions
  const nextImage = () => {
    if (!visit?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev === visit.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    if (!visit?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? visit.images.length - 1 : prev - 1
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading visit details...</p>
      </div>
    );
  }

  // Error state
  if (error || !visit) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {error || 'Visit not found'}
            </p>
            <Button className="mt-4" onClick={() => router.push('/visits')}>
              Return to Visits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasImages = visit.images && visit.images.length > 0;
  const hasMultipleImages = visit.images && visit.images.length > 1;

  // Image Carousel Component

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Visit Details</h1>
          {farmer && <p className="text-muted-foreground">{farmer.name}</p>}
        </div>
      </div>
      <div className="grid gap-6">
        {farmer && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Farmer Information</h2>
              </div>
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Name</span>
                  <span>{farmer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {farmer.location}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{farmer.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Visit Information</h2>
            </div>
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Visit Date</span>
                <span>{formatDate(visit.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Crop</span>
                <span className="flex items-center gap-1">
                  <Leaf className="h-4 w-4 text-green-600" />
                  {visit.crop.name}
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
        {hasImages && (
          <>
            <Card className="mb-6 overflow-hidden border shadow-sm">
              <CardContent className="p-0">
                <ImageCarousel images={visit.images} />
              </CardContent>
            </Card>

            {/* Fullscreen dialog for images */}
            <Dialog open={fullscreenView} onOpenChange={setFullscreenView}>
              <DialogContent className="max-w-screen-lg w-[90vw] h-[90vh] p-0 bg-black">
                <div className="relative w-full h-full flex items-center justify-center">
                  <VisuallyHidden>
                    <DialogTitle>Visit Image</DialogTitle>
                  </VisuallyHidden>
                  <Image
                    src={visit.images[currentImageIndex]}
                    alt={`Visit photo ${currentImageIndex + 1}`}
                    fill
                    className="max-w-full max-h-full object-contain"
                  />

                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-12 w-12"
                        onClick={previousImage}
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-12 w-12"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-8 w-8" />
                      </Button>
                    </>
                  )}

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white rounded-full px-3 py-1.5">
                    {currentImageIndex + 1} / {visit.images.length}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

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
      </div>
    </div>
  );
}
