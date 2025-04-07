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

// The extracted PurchaseCard component
import { PurchaseCard } from '@/components/purchases/PurchaseCard'; // Adjust path if needed

export default function PurchasesPage() {
  const router = useRouter();
  const { getFarmers, getPurchasesByFarmerId, deletePurchase } = useFirebase();

  // State for data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({}); // Farmer lookup map

  // State for UI and Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWorkingCombosOnly, setShowWorkingCombosOnly] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // Tracks ID being deleted

  // --- Fetch all necessary data on initial load ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get all farmers for lookup
        const farmersResponse = await getFarmers();
        const farmersMap: Record<string, Farmer> = {};
        farmersResponse.data.forEach((farmer) => {
          farmersMap[farmer.id] = farmer;
        });
        setFarmers(farmersMap);

        // 2. Get all purchases (can be optimized if too many farmers/purchases)
        // Consider fetching all purchases directly if your backend/rules allow efficient querying
        const allPurchases: Purchase[] = [];
        const purchasesPromises = farmersResponse.data.map(async (farmer) => {
          try {
            return await getPurchasesByFarmerId(farmer.id);
          } catch (error) {
            console.error(
              `Error fetching purchases for farmer ${farmer.id}:`,
              error
            );
            return []; // Return empty array on error for this farmer
          }
        });

        const purchasesResults = await Promise.all(purchasesPromises);
        purchasesResults.forEach((farmerPurchases) => {
          allPurchases.push(...farmerPurchases);
        });

        // 3. Sort purchases by date (newest first)
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
  }, [getFarmers, getPurchasesByFarmerId]); // Dependencies for useEffect

  // --- Filter purchases based on search term and working combo filter ---
  const filteredPurchases = purchases.filter((purchase) => {
    const farmer = farmers[purchase.farmerId];
    // If farmer data isn't loaded yet for this purchase, maybe exclude it or handle differently
    if (!farmer) return false;

    // Apply working combo filter
    if (showWorkingCombosOnly && !purchase.isWorkingCombo) {
      return false;
    }

    // Apply search term filter (if search term exists)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const isMatch =
        farmer.name.toLowerCase().includes(searchLower) ||
        farmer.location.toLowerCase().includes(searchLower) ||
        purchase.crop.name.toLowerCase().includes(searchLower) ||
        purchase.items.toLowerCase().includes(searchLower); // Search purchase items string
      if (!isMatch) return false;
    }

    // If it passes all filters, include it
    return true;
  });

  // --- Helper to get farmer data (used in the map) ---
  const getFarmerById = (farmerId: string): Farmer | null => {
    return farmers[farmerId] || null;
  };

  // --- Handle Delete Action (passed down to PurchaseCard) ---
  const handleDeletePurchase = async (id: string) => {
    if (deleteLoading) return; // Prevent double clicks

    setDeleteLoading(id); // Set loading state for the specific ID being deleted
    try {
      await deletePurchase(id);
      // Update local state to remove the deleted purchase immediately
      setPurchases((prevPurchases) =>
        prevPurchases.filter((purchase) => purchase.id !== id)
      );
      toast.success('Purchase deleted successfully');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete purchase. Please try again.');
    } finally {
      setDeleteLoading(null); // Clear loading state regardless of outcome
    }
  };

  // --- Render loading state ---
  if (loading) {
    return <PageLoader />;
  }

  // --- Render Page Content ---
  return (
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
            className="w-full sm:w-[300px]" // Responsive width
          />
          <Button
            onClick={() => router.push('/purchases/new')}
            className="bg-primary text-primary-foreground whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase
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
          // Ensure farmer data is available before rendering the card
          if (!farmer) {
            // Optionally log or handle this case
            // console.warn(`Farmer data missing for purchase ID: ${purchase.id}, Farmer ID: ${purchase.farmerId}`);
            return null; // Don't render card if farmer data isn't ready/found
          }

          // Render the extracted PurchaseCard component
          return (
            <PurchaseCard
              key={purchase.id} // React key for list rendering
              purchase={purchase}
              farmer={farmer}
              onDelete={handleDeletePurchase} // Pass delete handler
              deleteLoading={deleteLoading === purchase.id} // Pass loading status for this card
            />
          );
        })}
      </div>

      {/* Empty State Message */}
      {filteredPurchases.length === 0 && !loading && (
        <div className="text-center py-10 text-muted-foreground col-span-full">
          {' '}
          {/* Ensure it spans grid columns if needed */}
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
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Purchase
          </Button>
        </div>
      )}
    </div>
  );
}
