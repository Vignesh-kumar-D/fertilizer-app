// src/pages/purchases/index.tsx (or wherever PurchasesPage component lives)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Your Firebase and Type Imports
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Purchase, Farmer } from '@/types';

// UI Components used directly on this page
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PageLoader } from '@/components/shared/loader'; // Assuming you have this

// Icons used directly on this page
import { Plus, Star } from 'lucide-react';

// The extracted PurchaseCard component (ensure it's updated to accept onImageClick)
import { PurchaseCard } from '@/components/purchases/PurchaseCard'; // Adjust path if needed

// --- ADDED: Lightbox Imports ---
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
// import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"; // Optional
// import Captions from "yet-another-react-lightbox/plugins/captions"; // Optional
// CSS should be imported globally (e.g., in layout.tsx or globals.css)
// import "yet-another-react-lightbox/styles.css";
// import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function PurchasesPage() {
  const router = useRouter();
  const {
    getFarmers,
    getPurchasesByFarmerId,

    // deletePurchase
  } = useFirebase();

  // --- Existing State ---
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWorkingCombosOnly, setShowWorkingCombosOnly] = useState(false);

  // --- ADDED: Lightbox State ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]); // Store slides for lightbox

  // --- Existing useEffect for fetching data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get farmers
        const farmersResponse = await getFarmers();
        const farmersMap: Record<string, Farmer> = {};
        farmersResponse.data.forEach((farmer) => {
          farmersMap[farmer.id] = farmer;
        });
        setFarmers(farmersMap);

        // 2. Get purchases
        const allPurchases: Purchase[] = [];
        const purchasesPromises = farmersResponse.data.map((farmer) =>
          getPurchasesByFarmerId(farmer.id).catch((error) => {
            console.error(
              `Error fetching purchases for farmer ${farmer.id}:`,
              error
            );
            return [];
          })
        );
        const purchasesResults = await Promise.all(purchasesPromises);
        purchasesResults.forEach((farmerPurchases) => {
          allPurchases.push(...farmerPurchases);
        });

        // 3. Sort
        allPurchases.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPurchases(allPurchases);
      } catch (error) {
        console.error('Error fetching initial page data:', error);
        toast.error('Failed to load purchase data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getFarmers, getPurchasesByFarmerId]);

  // --- Existing filter logic ---
  const filteredPurchases = purchases.filter((purchase) => {
    const farmer = farmers[purchase.farmerId];
    if (!farmer) return false;
    if (showWorkingCombosOnly && !purchase.isWorkingCombo) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const isMatch =
        farmer.name.toLowerCase().includes(searchLower) ||
        farmer.location.toLowerCase().includes(searchLower) ||
        purchase.crop.name.toLowerCase().includes(searchLower) ||
        purchase.items.toLowerCase().includes(searchLower);
      if (!isMatch) return false;
    }
    return true;
  });

  // --- Existing getFarmerById helper ---
  const getFarmerById = (farmerId: string): Farmer | null =>
    farmers[farmerId] || null;

  // --- Existing delete handler ---
  // const handleDeletePurchase = async (id: string) => {
  //   if (deleteLoading) return;
  //   setDeleteLoading(id);
  //   try {
  //     await deletePurchase(id);
  //     setPurchases((prev) => prev.filter((p) => p.id !== id));
  //     toast.success('Purchase deleted successfully');
  //   } catch (error) {
  //     console.error('Error deleting purchase:', error);
  //     toast.error('Failed to delete purchase.');
  //   } finally {
  //     setDeleteLoading(null);
  //   }
  // };

  // --- ADDED: Lightbox Handler ---
  const handleImageClick = (images: string[], startIndex: number) => {
    setLightboxImages(images.map((src) => ({ src }))); // Prepare slides
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  // --- Existing loading render ---
  if (loading) {
    return <PageLoader />;
  }

  // --- Render Page Content ---
  return (
    // Wrap content and lightbox in a fragment
    <>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Purchases</h1>
            <p className="text-muted-foreground">Manage all purchase records</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Input
              placeholder="Search by farmer, crop, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[300px]"
            />
            <Button
              onClick={() => router.push('/purchases/new')}
              className="bg-primary text-primary-foreground whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Purchase
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="working-combos"
            checked={showWorkingCombosOnly}
            onCheckedChange={(checked) =>
              setShowWorkingCombosOnly(checked === true)
            }
          />
          <label
            htmlFor="working-combos"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center cursor-pointer select-none"
          >
            <Star className="h-4 w-4 mr-1.5 text-yellow-500 inline" />
            Show Working Combos Only
          </label>
        </div>

        {/* Purchase List Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPurchases.map((purchase) => {
            const farmer = getFarmerById(purchase.farmerId);
            if (!farmer) {
              return null;
            }

            return (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
                farmer={farmer}
                // onDelete={handleDeletePurchase}
                // deleteLoading={deleteLoading === purchase.id}
                // --- Pass the handler down to PurchaseCard ---
                onImageClick={handleImageClick}
              />
            );
          })}
        </div>

        {/* Empty State Message */}
        {filteredPurchases.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground col-span-full">
            <p className="mb-4 text-lg">
              {showWorkingCombosOnly
                ? 'No working combo purchases found.'
                : searchTerm
                ? 'No purchases found matching your search.'
                : 'No purchases recorded yet.'}
            </p>
            <Button
              onClick={() => router.push('/purchases/new')}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Your First Purchase
            </Button>
          </div>
        )}
      </div>

      {/* Render Lightbox Component */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxImages}
        plugins={[Fullscreen, Zoom]} // Add Thumbnails, Captions if desired
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, .9)' } }}
        zoom={{ doubleTapDelay: 200, doubleClickDelay: 300 }}
      />
    </>
  );
}
