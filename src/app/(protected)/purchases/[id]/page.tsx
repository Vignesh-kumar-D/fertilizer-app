// src/app/purchases/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react'; // Import React
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Tag,
  Loader2,
  Expand,
  Leaf,
} from 'lucide-react'; // Added Expand
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import FormattedDate from '@/lib/FormattedDate';
import { Purchase, Farmer } from '@/types';
import Image from 'next/image'; // Import next/image

// --- ADDED: Lightbox Imports ---
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Captions from 'yet-another-react-lightbox/plugins/captions';

export default function PurchaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getFarmerById, getPurchaseById } = useFirebase();

  // --- Existing State ---
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ADDED: Lightbox State ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // --- Fetch purchase and farmer data (no changes needed here) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const purchaseData = await getPurchaseById(id as string);
        if (!purchaseData) throw new Error('Purchase not found');
        setPurchase(purchaseData);

        const farmerData = await getFarmerById(purchaseData.farmerId);
        if (!farmerData) throw new Error('Farmer information not found');
        setFarmer(farmerData);
      } catch (err) {
        console.error('Error fetching purchase details:', err);
        setError('Failed to load purchase details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, getFarmerById, getPurchaseById]);

  // --- Existing loading and error states ---
  if (loading) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Loading purchase details...
        </p>
      </div>
    );
  }

  if (error || !purchase || !farmer) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="mb-6 flex items-center justify-center relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="absolute left-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          {error || 'Purchase or Farmer not found'}
        </p>
        <Button onClick={() => router.push('/purchases')}>
          Back to Purchases
        </Button>
      </div>
    );
  }

  // --- Prepare slides for Lightbox ---
  const slides =
    purchase.images?.map((imgUrl, index) => ({
      src: imgUrl,
      title: `Purchase Photo ${index + 1}`,
      description: `Image ${index + 1} of ${purchase.images?.length || 0}`,
    })) || [];
  const hasImages = slides.length > 0;

  // --- Existing getStatusBadge function ---
  const getStatusBadge = () => {
    if (purchase.remainingAmount === 0) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          Paid
        </Badge>
      );
    } else if (purchase.amountPaid > 0) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          Partial
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          Pending
        </Badge>
      );
    }
  };

  return (
    // Wrap content and lightbox in fragment
    <>
      <div className="container mx-auto p-4 max-w-3xl pb-10">
        {' '}
        {/* Added pb-10 */}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Purchase Details</h1>
          </div>
          {/* Optional: Add Edit button here? */}
          {/* <Button variant="outline" size="sm" onClick={() => router.push(`/purchases/${id}/edit`)}>Edit</Button> */}
        </div>
        <div className="grid gap-6">
          {/* --- ADDED: Image Display Card --- */}

          {/* Purchase Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ... existing overview content ... */}
              <div className="grid gap-4 text-sm sm:text-base">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                  </div>
                  <FormattedDate date={purchase.date} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total:</span>
                  </div>
                  <span className="font-medium">
                    ₹{purchase.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Paid:</span>
                  </div>
                  <span className="font-medium text-green-600">
                    ₹{purchase.amountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">Due:</span>
                  </div>
                  <span className="font-medium text-red-600">
                    ₹{purchase.remainingAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                  </div>
                  {getStatusBadge()}
                </div>
                {/* Quantity? Crop? */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Quantity:</span>
                  </div>
                  <span>{purchase.quantity}L</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Crop:</span>
                  </div>
                  <span>{purchase.crop.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farmer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Farmer Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ... existing farmer content ... */}
              <div
                className="grid gap-4 cursor-pointer hover:bg-accent/50 p-2 -m-2 rounded-md transition-colors text-sm sm:text-base" // Added hover effect, adjusted padding
                onClick={() => router.push(`/farmers/${farmer.id}`)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">{farmer.name}</span>
                  <Badge variant="outline">{farmer.location}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{farmer.phone}</span>
                </div>
                {/* Displaying farmer.totalDue might be context-dependent, ensure it's relevant here */}
                {/* <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Farmer Total Due:</span>
                    <span className="font-medium text-red-600">₹{farmer.totalDue?.toLocaleString('en-IN') ?? '0'}</span>
                 </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader>
              <CardTitle>Items Purchased</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ... existing items content ... */}
              <div className="grid gap-4">
                <div className="flex items-start gap-2">
                  {' '}
                  {/* Use items-start */}
                  <Tag className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  {/* Use whitespace-pre-wrap if items can have line breaks */}
                  <p className="text-base whitespace-pre-wrap">
                    {purchase.items || (
                      <span className="italic text-muted-foreground">
                        No specific items listed.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {hasImages && (
            <Card>
              <CardHeader>
                <CardTitle>Photos ({slides.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={index}
                      type="button"
                      className="relative aspect-square overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:opacity-80 transition-opacity group"
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
          {/* Notes Card */}
          {purchase.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {purchase.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Render the Lightbox Component */}
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
