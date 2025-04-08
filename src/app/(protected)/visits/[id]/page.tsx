// src/app/visits/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Calendar,
  Clipboard,
  ListChecks,
  Circle,
  Leaf,
  Loader2,
  User,
  MapPin,
  Expand, // Icon for fullscreen trigger
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Visit, Farmer } from '@/types';
import Image from 'next/image'; // Keep next/image for previews
import { format } from 'date-fns'; // Use date-fns for robust formatting

// Import Lightbox component and plugins
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Captions from 'yet-another-react-lightbox/plugins/captions';

// Remember to import CSS globally (layout.tsx or globals.css)
// import "yet-another-react-lightbox/styles.css";
// import "yet-another-react-lightbox/plugins/thumbnails.css";
// import "yet-another-react-lightbox/plugins/captions.css";

export default function VisitDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { getVisitById, getFarmerById } = useFirebase();

  const [visit, setVisit] = useState<Visit | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // --- Fetch visit and farmer data (no changes needed here) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset error
      try {
        const visitData = await getVisitById(id as string);
        if (!visitData) throw new Error('Visit not found');
        setVisit(visitData);

        const farmerData = await getFarmerById(visitData.farmerId);
        if (!farmerData) throw new Error('Farmer information not found'); // Throw error to be caught
        setFarmer(farmerData);
      } catch (err) {
        console.error('Error fetching visit details:', err);
        setError('Failed to load visit details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, getVisitById, getFarmerById]);

  // --- Helper function to format date ---
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'PPP'); // e.g., Apr 8th, 2025
    } catch {
      return dateString; // Fallback
    }
  };

  // --- Prepare slides for Lightbox ---
  const slides =
    visit?.images?.map((imgUrl, index) => ({
      src: imgUrl,
      title: `Visit Photo ${index + 1}`,
      description: `Image ${index + 1} of ${visit.images?.length || 0}`,
    })) || [];

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading visit details...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error || !visit) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {error || 'Visit could not be loaded.'}
            </p>
            <Button className="mt-4" onClick={() => router.push('/visits')}>
              Return to Visits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Derived state for images
  const hasImages = slides.length > 0;

  return (
    <>
      <div className="container mx-auto p-4 max-w-3xl pb-10">
        {' '}
        {/* Added pb-10 */}
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Visit Details</h1>
            {farmer && <p className="text-muted-foreground">{farmer.name}</p>}
          </div>
        </div>
        {/* Main Content Grid */}
        <div className="grid gap-6">
          {/* Farmer Info Card */}
          {farmer && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Farmer Information</h2>
                </div>
                {/* ... farmer details grid ... */}
                <div className="grid gap-4 text-sm">
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

          {/* Visit Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Visit Information</h2>
              </div>
              {/* ... visit details grid ... */}
              <div className="grid gap-4 text-sm">
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
                      fill="currentColor" // Fill the circle
                    />
                    {visit.cropHealth.charAt(0).toUpperCase() +
                      visit.cropHealth.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Section - Renders a grid of clickable thumbnails */}
          {hasImages && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {/* Optional: Add an Image icon here */}
                  <h2 className="font-semibold">Photos ({slides.length})</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={index}
                      type="button"
                      className="relative aspect-square overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <Image
                        src={slide.src}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, 18vw" // Optimize image loading sizes
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Expand className="h-6 w-6 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Recommendations</h2>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                {visit.recommendations || (
                  <span className="italic">No recommendations recorded.</span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clipboard className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Notes</h2>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                {visit.notes || (
                  <span className="italic">No notes recorded.</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Render the Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        // Enable plugins
        plugins={[Fullscreen, Zoom, Thumbnails, Captions]}
        // Optional: Customize zoom, captions, etc.
        zoom={{ doubleTapDelay: 200, doubleClickDelay: 300 }}
        captions={{ showToggle: true, descriptionTextAlign: 'center' }}
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, .9)' } }} // Darker background
      />
    </>
  );
}
