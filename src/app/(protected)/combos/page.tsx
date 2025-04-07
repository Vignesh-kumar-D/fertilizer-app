// src/app/combos/page.tsx (or src/pages/combos.tsx)
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
// REMOVE Checkbox import
// import { Checkbox } from '@/components/ui/checkbox';
import { PageLoader } from '@/components/shared/loader';

// Icons used directly on this page
import { Plus, Star } from 'lucide-react'; // Kept Star for potential future use, can be removed

// The PurchaseCard component (reused)
import { PurchaseCard } from '@/components/purchases/PurchaseCard'; // Adjust path if needed

export default function WorkingCombosPage() {
  // Renamed component
  const router = useRouter();
  const { getFarmers, getPurchasesByFarmerId, deletePurchase } = useFirebase();

  // State for data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});

  // State for UI and Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  // REMOVE showWorkingCombosOnly state
  // const [showWorkingCombosOnly, setShowWorkingCombosOnly] = useState(false);

  // --- Fetch all necessary data on initial load (Same as PurchasesPage) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get all farmers
        const farmersResponse = await getFarmers();
        const farmersMap: Record<string, Farmer> = {};
        farmersResponse.data.forEach((farmer) => {
          farmersMap[farmer.id] = farmer;
        });
        setFarmers(farmersMap);

        // 2. Get all purchases
        const allPurchases: Purchase[] = [];
        const purchasesPromises = farmersResponse.data.map(async (farmer) => {
          try {
            return await getPurchasesByFarmerId(farmer.id);
          } catch (error) {
            console.error(
              `Error fetching purchases for farmer ${farmer.id}:`,
              error
            );
            return [];
          }
        });
        const purchasesResults = await Promise.all(purchasesPromises);
        purchasesResults.forEach((farmerPurchases) => {
          allPurchases.push(...farmerPurchases);
        });

        // 3. Sort purchases by date (Optional, but good for consistency)
        allPurchases.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPurchases(allPurchases); // Store ALL purchases initially
      } catch (error) {
        console.error('Error fetching initial page data:', error);
        toast.error('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getFarmers, getPurchasesByFarmerId]);

  // --- Filter purchases - MODIFIED ---
  const filteredPurchases = purchases.filter((purchase) => {
    // *** Primary Filter: Only include working combos ***
    if (!purchase.isWorkingCombo) {
      return false;
    }

    const farmer = farmers[purchase.farmerId];
    // Ensure farmer data is loaded
    if (!farmer) {
      return false;
    }

    // Apply search term filter (if search term exists)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const isMatch =
        farmer.name.toLowerCase().includes(searchLower) ||
        farmer.location.toLowerCase().includes(searchLower) ||
        purchase.crop.name.toLowerCase().includes(searchLower) ||
        purchase.items.toLowerCase().includes(searchLower);
      if (!isMatch) {
        return false;
      }
    }

    // If it's a working combo and passes the search filter (or no search term), include it
    return true;
  });

  // --- Helper to get farmer data (Same as PurchasesPage) ---
  const getFarmerById = (farmerId: string): Farmer | null => {
    return farmers[farmerId] || null;
  };

  // --- Handle Delete Action (Same as PurchasesPage) ---
  const handleDeletePurchase = async (id: string) => {
    if (deleteLoading) return;
    setDeleteLoading(id);
    try {
      await deletePurchase(id);
      setPurchases((prevPurchases) =>
        prevPurchases.filter((purchase) => purchase.id !== id)
      );
      toast.success('Combo/Purchase deleted successfully'); // Slightly adjusted message
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete combo/purchase.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // --- Render loading state ---
  if (loading) {
    return <PageLoader />;
  }

  // --- Render Page Content ---
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Section - MODIFIED Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" /> {/* Added Star Icon */}
            <h1 className="text-2xl font-bold">Working Combos</h1>
          </div>
          <p className="text-muted-foreground">
            Browse successful purchase combinations
          </p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search combos..." // Modified placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[300px]"
          />
          {/* Kept Add Purchase button - remove if not desired */}
          <Button
            onClick={() => router.push('/purchases/new')}
            className="bg-primary text-primary-foreground whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase
          </Button>
        </div>
      </div>

      {/* REMOVE Working Combo Filter Checkbox Section */}
      {/*
            <div className="flex items-center space-x-2 pt-2">
               ... checkbox removed ...
            </div>
            */}

      {/* Purchase List Grid (Uses PurchaseCard) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
        {' '}
        {/* Added pt-4 for spacing */}
        {filteredPurchases.map((purchase) => {
          const farmer = getFarmerById(purchase.farmerId);
          if (!farmer) {
            return null; // Don't render card if farmer data isn't ready/found
          }

          // Render the standard PurchaseCard component
          return (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              farmer={farmer}
              onDelete={handleDeletePurchase}
              deleteLoading={deleteLoading === purchase.id}
            />
          );
        })}
      </div>

      {/* Empty State Message - MODIFIED */}
      {filteredPurchases.length === 0 && !loading && (
        <div className="text-center py-10 text-muted-foreground col-span-full">
          <div className="flex justify-center mb-4">
            <Star className="h-12 w-12 text-yellow-400 opacity-80" />
          </div>
          <p className="mb-4 text-lg">
            {searchTerm
              ? 'No working combos found matching your search.'
              : 'No working combos recorded yet.'}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Mark purchases as &apos;Working Combo&apos; in the purchase form.
          </p>
          <Button
            onClick={() => router.push('/purchases/new')}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add a New Purchase
          </Button>
        </div>
      )}
    </div>
  );
}
