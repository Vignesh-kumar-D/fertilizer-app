// src/pages/visits/index.tsx (or wherever VisitList component lives)
'use client';

import React, { useState, useEffect } from 'react'; // Keep React import
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

// The extracted VisitCard component (ensure it's the updated version with onImageClick)
import { VisitCard } from '@/components/visits/VisitCard'; // Adjust path if needed

// --- ADDED: Lightbox Imports ---
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
// import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"; // Optional
// import Captions from "yet-another-react-lightbox/plugins/captions"; // Optional
// CSS should be imported globally (e.g., in layout.tsx or globals.css)
// import "yet-another-react-lightbox/styles.css";
// import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function VisitList() {
  const router = useRouter();
  const { getVisitsByFarmerId, getFarmers, deleteVisit } = useFirebase();

  // --- Existing State ---
  const [visits, setVisits] = useState<Visit[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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

        // 2. Get visits
        const visitPromises = farmersResponse.data.map((farmer) =>
          getVisitsByFarmerId(farmer.id).catch((error) => {
            console.error(
              `Error fetching visits for farmer ${farmer.id}:`,
              error
            );
            return [];
          })
        );
        const visitsArrays = await Promise.all(visitPromises);
        const allVisits = visitsArrays.flat();

        // 3. Sort
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
  }, [getFarmers, getVisitsByFarmerId]);

  // --- Existing filter logic ---
  const filteredVisits = visits.filter((visit) => {
    const farmer = farmers[visit.farmerId];
    if (!farmer) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
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

  // --- Existing delete handler ---
  const handleDeleteVisit = async (id: string) => {
    if (deleteLoading) return;
    setDeleteLoading(id);
    try {
      await deleteVisit(id);
      setVisits((prev) => prev.filter((v) => v.id !== id));
      toast.success('Visit deleted successfully');
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Failed to delete visit.');
    } finally {
      setDeleteLoading(null);
    }
  };

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
              <Plus className="h-4 w-4 mr-2" /> Add Visit
            </Button>
          </div>
        </div>

        {/* Visit List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((visit) => {
            const farmer = farmers[visit.farmerId];
            if (!farmer) {
              return null;
            }

            return (
              <VisitCard
                key={visit.id}
                visit={visit}
                farmer={farmer}
                onDelete={handleDeleteVisit}
                deleteLoading={deleteLoading === visit.id}
                // --- Pass the handler down ---
                onImageClick={handleImageClick}
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
            <Button
              onClick={() => router.push('/visits/new')}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Your First Visit
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
