// src/pages/farmers/[farmerId]/crops/[cropId]/activities.tsx (or similar path)
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Farmer, Crop, CropActivity } from '@/types';
// Updated import path assumption
import { FarmerCropHeader } from '@/components/farmers/FarmerCropHeader';
import { FarmerCropActivitiesList } from '@/components/farmers/FarmerCropActivitiesList';
import { toast } from 'sonner';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { ArrowLeft, History } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// --- ADDED: Lightbox Imports ---
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
// import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"; // Optional
// import Captions from "yet-another-react-lightbox/plugins/captions"; // Optional
// CSS should be imported globally (e.g., in layout.tsx or globals.css)
// import "yet-another-react-lightbox/styles.css";
// import "yet-another-react-lightbox/plugins/thumbnails.css";

interface FarmerCropActivitiesProps {
  farmerId: string;
  cropId: string;
}

export default function FarmerCropActivities({
  farmerId,
  cropId,
}: FarmerCropActivitiesProps) {
  //   const router = useRouter();
  const {
    getFarmerById,
    getCropById,
    getCropActivity,
    deleteVisit,
    deletePurchase,
  } = useFirebase();

  // --- Existing State ---
  const [activeTab, setActiveTab] = useState<'all' | 'visit' | 'purchase'>(
    'all'
  );
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [activities, setActivities] = useState<CropActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingVisitId, setLoadingVisitId] = useState<string | null>(null);
  const [loadingPurchaseId, setLoadingPurchaseId] = useState<string | null>(
    null
  );

  // --- ADDED: Lightbox State ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);

  // --- Existing Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ... fetch logic ...
      const [farmerData, cropData] = await Promise.all([
        getFarmerById(farmerId),
        getCropById(cropId),
      ]);
      if (!farmerData) throw new Error('Farmer not found');
      if (!cropData) throw new Error('Crop not found');
      setFarmer(farmerData);
      setCrop(cropData);
      const cropActivitiesData = await getCropActivity(farmerId, cropId);
      cropActivitiesData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setActivities(cropActivitiesData);
    } catch (err) {
      console.error('Error fetching crop activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [farmerId, cropId, getFarmerById, getCropById, getCropActivity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Existing Delete Handlers ---
  const handleDeleteVisit = async (id: string) => {
    if (loadingVisitId) return;
    setLoadingVisitId(id);
    try {
      await deleteVisit(id);
      setActivities((prev) =>
        prev.filter((act) => !(act.type === 'visit' && act.id === id))
      );
      toast.success('Visit deleted');
    } catch {
      /* ... error handling ... */ toast.error('Failed to delete visit');
    } finally {
      setLoadingVisitId(null);
    }
  };
  const handleDeletePurchase = async (id: string) => {
    if (loadingPurchaseId) return;
    setLoadingPurchaseId(id);
    try {
      await deletePurchase(id);
      setActivities((prev) =>
        prev.filter((act) => !(act.type === 'purchase' && act.id === id))
      );
      toast.success('Purchase deleted');
    } catch {
      /* ... error handling ... */ toast.error('Failed to delete purchase');
    } finally {
      // Corrected typo
      setLoadingPurchaseId(null);
    }
  };

  // --- ADDED: Lightbox Handler ---
  const handleImageClick = (images: string[], startIndex: number) => {
    if (!images || images.length === 0) return; // Avoid opening empty lightbox
    setLightboxImages(images.map((src) => ({ src }))); // Prepare slides
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  // --- Existing Filter logic ---
  const filteredActivities = activities.filter((activity) => {
    if (activeTab === 'all') return true;
    return activity.type === activeTab;
  });

  // --- Existing Loading Render ---
  if (loading) {
    /* ... */ return <Loader2 />;
  }

  // --- Existing Error Render ---
  if (error || !farmer || !crop) {
    /* ... */ return <div>Error...</div>;
  }

  // Calculate counts
  const visitCount = activities.filter((a) => a.type === 'visit').length;
  const purchaseCount = activities.filter((a) => a.type === 'purchase').length;
  const allCount = activities.length;

  // --- Render Main Content ---
  return (
    // Wrap in fragment to include Lightbox
    <>
      <div className="container mx-auto p-4 space-y-6 pb-10">
        {' '}
        {/* Added pb-10 */}
        {/* Render Header */}
        <FarmerCropHeader farmer={farmer} crop={crop} />
        {/* Render Tabs */}
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as 'all' | 'visit' | 'purchase')
          }
        >
          <div className="border-b mb-4 pb-2">
            <TabsList>
              {/* All Tab */}
              <TabsTrigger value="all" className="px-3 sm:px-4">
                All{' '}
                {allCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 sm:ml-2 text-xs px-1.5"
                  >
                    {allCount}
                  </Badge>
                )}
              </TabsTrigger>
              {/* Visits Tab */}
              <TabsTrigger value="visit" className="px-3 sm:px-4">
                Visits{' '}
                {visitCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 sm:ml-2 text-xs px-1.5"
                  >
                    {visitCount}
                  </Badge>
                )}
              </TabsTrigger>
              {/* Purchases Tab */}
              <TabsTrigger value="purchase" className="px-3 sm:px-4">
                Purchases{' '}
                {purchaseCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 sm:ml-2 text-xs px-1.5"
                  >
                    {purchaseCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Render List Component within Tab Content */}
          <TabsContent value={activeTab} className="mt-4">
            <FarmerCropActivitiesList
              activities={filteredActivities}
              farmer={farmer}
              crop={crop}
              activeTab={activeTab}
              onDeleteVisit={handleDeleteVisit}
              onDeletePurchase={handleDeletePurchase}
              loadingVisitId={loadingVisitId}
              loadingPurchaseId={loadingPurchaseId}
              // --- Pass image click handler down ---
              onImageClick={handleImageClick}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Render Lightbox Component */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxImages}
        plugins={[Fullscreen, Zoom]} // Add other plugins if needed
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, .9)' } }}
        zoom={{ doubleTapDelay: 200, doubleClickDelay: 300 }}
      />
    </>
  );
}
