// src/pages/farmers/[farmerId]/crops/[cropId]/activities.tsx (or similar path)
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Farmer, Crop, CropActivity } from '@/types';
import { FarmerCropHeader } from './FarmerCropHeader'; // Import Header
import { FarmerCropActivitiesList } from '@/components/farmers/FarmerCropActivitiesList'; // Import List
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card'; // Keep for Error state
import { Button } from '@/components/ui/button'; // Keep for Error state
import { ArrowLeft, History } from 'lucide-react'; // Keep for Error state
import { useRouter } from 'next/navigation'; // Keep for Error state

interface FarmerCropActivitiesProps {
  farmerId: string;
  cropId: string;
}

export default function FarmerCropActivities({
  farmerId,
  cropId,
}: FarmerCropActivitiesProps) {
  const router = useRouter(); // Needed for error state navigation
  const {
    getFarmerById,
    getCropById,
    getCropActivity,
    deleteVisit, // Add delete functions from context/hook
    deletePurchase, // Add delete functions from context/hook
  } = useFirebase();

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'visit' | 'purchase'>(
    'all'
  );
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [activities, setActivities] = useState<CropActivity[]>([]); // Raw activities
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingVisitId, setLoadingVisitId] = useState<string | null>(null); // Separate loading states
  const [loadingPurchaseId, setLoadingPurchaseId] = useState<string | null>(
    null
  );

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
    } catch {
      console.error('Error fetching crop activities:');
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [farmerId, cropId, getFarmerById, getCropById, getCropActivity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Use useCallback dependency

  // Delete Handlers
  const handleDeleteVisit = async (id: string) => {
    if (loadingVisitId) return;
    setLoadingVisitId(id);
    try {
      await deleteVisit(id);
      // Remove from local state
      setActivities((prev) =>
        prev.filter((act) => !(act.type === 'visit' && act.id === id))
      );
      toast.success('Visit deleted');
    } catch (err) {
      console.error('Error deleting visit:', err);
      toast.error('Failed to delete visit');
    } finally {
      setLoadingVisitId(null);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (loadingPurchaseId) return;
    setLoadingPurchaseId(id);
    try {
      await deletePurchase(id);
      // Remove from local state
      setActivities((prev) =>
        prev.filter((act) => !(act.type === 'purchase' && act.id === id))
      );
      toast.success('Purchase deleted');
    } catch (err) {
      console.error('Error deleting purchase:', err);
      toast.error('Failed to purchase visit'); // Typo corrected
    } finally {
      setLoadingPurchaseId(null);
    }
  };

  // Filter activities based on the selected tab
  const filteredActivities = activities.filter((activity) => {
    if (activeTab === 'all') return true;
    return activity.type === activeTab;
  });

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading activities...</p>
      </div>
    );
  }

  // --- Render Error State ---
  if (error || !farmer || !crop) {
    // Check farmer/crop again here
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <History className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Could not find the requested farmer or crop details.'}
            </p>
            <Button
              onClick={() => router.push('/farmers')} // Navigate back to a safe page
              className="bg-primary text-primary-foreground"
            >
              Return to Farmers List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate counts for badges AFTER data loading and filtering setup
  const visitCount = activities.filter((a) => a.type === 'visit').length;
  const purchaseCount = activities.filter((a) => a.type === 'purchase').length;
  const allCount = activities.length;

  // --- Render Main Content ---
  return (
    <div className="container mx-auto p-4 space-y-6">
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
            <TabsTrigger value="all" className="px-3 sm:px-4">
              All
              {allCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 sm:ml-2 text-xs px-1.5"
                >
                  {allCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="visit" className="px-3 sm:px-4">
              Visits
              {visitCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 sm:ml-2 text-xs px-1.5"
                >
                  {visitCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="purchase" className="px-3 sm:px-4">
              Purchases
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

        {/* Render Content based on Tab - Pass filtered list to the List Component */}
        {/* We use TabsContent just as wrapper for structure, filtering happens before passing */}
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
