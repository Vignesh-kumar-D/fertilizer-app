// src/pages/visits/index.tsx (or wherever VisitList component lives)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Your Firebase and Type Imports
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Visit, Farmer } from '@/types';

// UI Components used directly on this page
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/shared/loader'; // Assuming you have this

// Icons used directly on this page
import { Plus } from 'lucide-react';

// The extracted VisitCard component
import { VisitCard } from '@/components/visits/VisitCard'; // Adjust path if needed

export default function VisitList() {
  const router = useRouter();
  const { getVisitsByFarmerId, getFarmers, deleteVisit } = useFirebase();

  // State for data
  const [visits, setVisits] = useState<Visit[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({}); // Farmer lookup map

  // State for UI and Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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

        // 2. Fetch visits for each farmer
        // (Consider optimizing if performance becomes an issue)
        const visitPromises = farmersResponse.data.map((farmer) =>
          getVisitsByFarmerId(farmer.id).catch((error) => {
            console.error(
              `Error fetching visits for farmer ${farmer.id}:`,
              error
            );
            return []; // Return empty on error for specific farmer
          })
        );
        const visitsArrays = await Promise.all(visitPromises);
        const allVisits = visitsArrays.flat();

        // 3. Sort visits by date (newest first)
        allVisits.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setVisits(allVisits);
      } catch (error) {
        console.error('Error fetching initial visit data:', error);
        toast.error('Failed to load visit data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getFarmers, getVisitsByFarmerId]); // Dependencies for useEffect

  // --- Filter visits based on search term ---
  const filteredVisits = visits.filter((visit) => {
    const farmer = farmers[visit.farmerId];
    if (!farmer) return false; // Don't show if farmer data not ready

    if (!searchTerm) return true; // Show all if no search term

    const searchLower = searchTerm.toLowerCase();

    // Improved search logic - check if fields exist before accessing .toLowerCase()
    const farmerNameMatch =
      farmer.name?.toLowerCase().includes(searchLower) || false;
    const farmerLocationMatch =
      farmer.location?.toLowerCase().includes(searchLower) || false;
    const cropNameMatch =
      visit.crop?.name?.toLowerCase().includes(searchLower) || false;
    const notesMatch =
      visit.notes?.toLowerCase().includes(searchLower) || false;
    const recommendationsMatch =
      visit.recommendations?.toLowerCase().includes(searchLower) || false;

    return (
      farmerNameMatch ||
      farmerLocationMatch ||
      cropNameMatch ||
      notesMatch ||
      recommendationsMatch
    );
  });

  // --- Handle Delete Action (passed down to VisitCard) ---
  const handleDeleteVisit = async (id: string) => {
    if (deleteLoading) return; // Prevent double delete clicks

    setDeleteLoading(id);
    try {
      await deleteVisit(id);
      // Update local state to remove deleted visit
      setVisits((prevVisits) => prevVisits.filter((visit) => visit.id !== id));
      toast.success('Visit deleted successfully');
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Failed to delete visit. Please try again.');
    } finally {
      setDeleteLoading(null); // Clear loading state
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
          <h1 className="text-2xl font-bold">Visits</h1>
          <p className="text-muted-foreground">
            Manage all field visit records
          </p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search by farmer, crop, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[300px]"
          />
          <Button
            onClick={() => router.push('/visits/new')}
            className="bg-primary text-primary-foreground whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Visit
          </Button>
        </div>
      </div>

      {/* Visit List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVisits.map((visit) => {
          const farmer = farmers[visit.farmerId];
          // Ensure farmer data is available before rendering the card
          if (!farmer) {
            // console.warn(`Farmer data missing for visit ID: ${visit.id}, Farmer ID: ${visit.farmerId}`);
            return null;
          }

          // Render the extracted VisitCard component
          return (
            <VisitCard
              key={visit.id} // React key for list rendering
              visit={visit}
              farmer={farmer}
              onDelete={handleDeleteVisit} // Pass delete handler
              deleteLoading={deleteLoading === visit.id} // Pass loading status for this card
            />
          );
        })}
      </div>

      {/* Empty State Message */}
      {filteredVisits.length === 0 && !loading && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4 text-lg">
            {searchTerm
              ? 'No visits found matching your search.'
              : 'No visits recorded yet.'}
          </p>
          <Button onClick={() => router.push('/visits/new')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Visit
          </Button>
        </div>
      )}
    </div>
  );
}
