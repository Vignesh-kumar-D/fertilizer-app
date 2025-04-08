// src/components/farmers/FarmerList.tsx (or your file path)
'use client';

import React, { useState, useEffect } from 'react'; // Import React
import { Card, CardContent } from '@/components/ui/card';
import {
  Edit2,
  Phone,
  MapPin,
  Plus,
  Leaf,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FarmerHeader } from './farmer-header'; // Adjust path as needed
import FormattedDate from '@/lib/FormattedDate'; // Adjust path as needed
import { Badge } from '@/components/ui/badge';
import { Crop, Farmer } from '@/types'; // Adjust path as needed
import Image from 'next/image';
import { useFirebase } from '@/lib/firebase/firebase-context'; // Adjust path as needed
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils'; // Adjust path as needed
import { toast } from 'sonner';

export function FarmerList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name'); // Default search field
  const { getFarmers, searchFarmers, deleteFarmer } = useFirebase();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null); // For pagination
  const [loading, setLoading] = useState(true); // Initial load
  const [searching, setSearching] = useState(false); // Search operation
  const [loadingMore, setLoadingMore] = useState(false); // Pagination load
  const [hasMore, setHasMore] = useState(true); // More data available for pagination

  // Initial fetch of farmers using useCallback for stable reference
  const fetchInitialFarmers = async (showLoading = true) => {
    if (showLoading) setLoading(true); // Control loading state visibility
    setSearching(false);
    // setSearchTerm(''); // Resetting search term here can sometimes cause issues if called from search effect. Reset outside effects.
    try {
      const response = await getFarmers();
      setFarmers(response.data);
      setLastDoc(response.lastDoc);
      setHasMore(response.data.length >= 20);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to fetch farmers list.'); // --- ADDED: Toast ---
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // --- Effect for Initial Load ---
  // Runs once on mount. Assumes getFarmers reference is stable OR changes rarely.
  useEffect(() => {
    console.log('Running initial fetch effect');
    setSearchTerm(''); // Reset search term on mount
    fetchInitialFarmers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFarmers]); // Keep getFarmers dependency assuming it's memoized in context. If loop persists, remove it and add // eslint-disable-line.

  // --- Effect for Handling Search ---
  useEffect(() => {
    // --- Define handleSearch INSIDE useEffect ---
    // This way it captures the current searchTerm and searchField
    const handleSearch = async () => {
      // Resetting: If search term is empty
      if (searchTerm.trim() === '') {
        // Only refetch initial list if we are *not* already loading AND *were* previously showing search results (hasMore is false) or list is empty
        if (!loading && (!hasMore || farmers.length === 0)) {
          console.log('Search cleared, fetching initial farmers');
          await fetchInitialFarmers(false); // Refetch without main loading indicator
        }
        return;
      }

      // --- Perform Search ---
      console.log(`Searching for "${searchTerm}" in ${searchField}`);
      setSearching(true);
      setLoading(false); // Ensure main loading is off
      try {
        const results = await searchFarmers(searchTerm, searchField); // Call context function directly
        setFarmers(results);
        setHasMore(false); // Search results disable 'Load More'
        setLastDoc(null); // Reset pagination marker
      } catch (error) {
        console.error('Error searching farmers:', error);
        toast.error(`Failed to search farmers for "${searchTerm}".`); // --- ADDED: Toast ---
      } finally {
        setSearching(false);
      }
    };

    // Debounce
    const debounceTimeout = setTimeout(() => {
      handleSearch();
    }, 300);

    // Cleanup
    return () => clearTimeout(debounceTimeout);
    // --- UPDATED Dependencies ---
    // We removed searchFarmers and fetchInitialFarmers (defined/called directly inside)
    // We depend on the search inputs and potentially loading/hasMore for conditional logic inside.
  }, [
    searchTerm,
    searchField,
    searchFarmers,
    loading,
    hasMore,
    farmers.length,
  ]); // Added farmers.length as proxy

  // --- Load More Farmers (Pagination) ---
  const loadMoreFarmers = async () => {
    if (!lastDoc || !hasMore || loadingMore || searching) return;
    setLoadingMore(true);
    try {
      const response = await getFarmers(lastDoc); // Call context function directly
      setFarmers((prev) => [...prev, ...response.data]);
      setLastDoc(response.lastDoc);
      setHasMore(response.data.length >= 20);
      if (response.data.length === 0) {
        // Explicitly set hasMore false if empty response
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more farmers:', error);
      toast.error('Failed to load more farmers.'); // --- ADDED: Toast ---
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle farmer deletion
  const handleDeleteFarmer = async (id: string) => {
    // Consider adding a confirmation dialog here for better UX
    // For simplicity, directly deleting now
    setLoading(true); // Use main loader during delete/refresh
    try {
      await deleteFarmer(id);
      await fetchInitialFarmers(); // Refetch the list after deletion
      // Optionally show success toast
    } catch {
      console.error('Error Deleting farmer:', id);
      // Optionally show error toast
    } finally {
      setLoading(false);
    }
  };

  // Placeholder image generator
  const placeholderImage = (name: string) => {
    const initials =
      name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??'; // Handle potential undefined name

    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium border">
        {' '}
        {/* Added border */}
        {initials}
      </div>
    );
  };

  // --- Main Component Render ---
  return (
    <div className="space-y-4 pb-10">
      {' '}
      {/* Added padding bottom */}
      {/* Header with Search Controls */}
      <FarmerHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchField={searchField}
        onSearchFieldChange={setSearchField}
      />
      {/* Loading State Indicator */}
      {(loading || searching) && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            {searching ? 'Searching farmers...' : 'Loading farmers...'}
          </p>
        </div>
      )}
      {/* Farmers Grid - Render only when not initial loading or searching */}
      {!loading && !searching && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmers.map((farmer) => (
            <Card
              key={farmer.id}
              className="hover:shadow-md transition-shadow relative group border flex flex-col" // Added flex flex-col
            >
              <CardContent className="p-4 flex flex-col flex-grow">
                {' '}
                {/* Added flex-grow */}
                {/* Farmer Info Header (Name, Phone, Location, Image, Actions) */}
                <div className="flex justify-between items-start mb-4">
                  {/* Left side details */}
                  <div className="flex-1 mr-4 space-y-1 cursor-pointer">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {farmer.displayName || farmer.name}
                    </h3>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{farmer.phone}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {farmer.displayZone || farmer.zone}
                      </span>
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {farmer.displayLocation || farmer.location}
                      </span>
                    </div>
                  </div>
                  {/* Right side image & actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {farmer.image ? (
                      <Image
                        src={farmer.image}
                        alt={farmer.name}
                        width={500}
                        height={500}
                        className="object-cover rounded-full h-10 w-10 border"
                      />
                    ) : (
                      placeholderImage(farmer.name)
                    )}
                    <div className="flex gap-1 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/farmers/${farmer.id}/edit`);
                        }}
                        aria-label="Edit Farmer"
                      >
                        {' '}
                        <Edit2 className="h-4 w-4" />{' '}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFarmer(farmer.id);
                        }} // Add confirmation later
                        aria-label="Delete Farmer"
                      >
                        {' '}
                        <Trash2 className="h-4 w-4" />{' '}
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Financial & Date Info */}
                <div className="space-y-1 border-t pt-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Due:</span>
                    <span
                      className={cn(
                        'font-medium',
                        farmer.totalDue > 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      ₹{farmer.totalDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid:</span>
                    <span
                      className={cn(
                        'font-medium',
                        farmer.totalPaid > 0
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      ₹{farmer.totalPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Visit:</span>
                    <FormattedDate date={farmer.lastVisitDate} />
                  </div>
                </div>
                {/* === THIS IS THE UPDATED CROPS SECTION === */}
                <div className="border-t pt-3 mb-4">
                  <div className="flex items-center text-sm font-medium mb-2">
                    <Leaf className="h-4 w-4 mr-1 text-green-600" /> Crops
                  </div>
                  {/* Container for scrolling badges */}
                  <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {' '}
                    {/* Horizontal scroll */}
                    {farmer.crops && farmer.crops.length > 0 ? (
                      farmer.crops.map((crop: Crop) => (
                        <Badge
                          key={crop.id}
                          variant="secondary" // Use secondary for background
                          className={cn(
                            'cursor-pointer hover:opacity-80 transition-opacity',
                            'text-sm font-semibold text-foreground', // MODIFIED: Larger, Bold, Default Text Color
                            'whitespace-nowrap px-3 py-1' // Prevent wrapping inside badge, adjust padding
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/farmers/${farmer.id}/crop/${crop.id}`
                            ); // Navigate to crop activities
                          }}
                        >
                          {crop.displayName ||
                            crop.name.charAt(0).toUpperCase() +
                              crop.name.slice(1)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        {' '}
                        No crops associated{' '}
                      </span>
                    )}
                  </div>
                </div>
                {/* === END OF UPDATED CROPS SECTION === */}
                {/* Add Visit/Purchase Buttons - Pushed to bottom */}
                <div className="mt-auto grid grid-cols-2 gap-2 border-t pt-3">
                  {' '}
                  {/* mt-auto pushes this section down */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/visits/new?farmerId=${farmer.id}`);
                    }}
                  >
                    {' '}
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Visit{' '}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/purchases/new?farmerId=${farmer.id}`);
                    }}
                  >
                    {' '}
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Purchase{' '}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Empty State Display - Rendered only when not loading/searching and farmers array is empty */}
      {!loading && !searching && farmers.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <p className="text-lg mb-4">
            {searchTerm
              ? `No farmers found matching "${searchTerm}" in ${searchField}`
              : 'No farmers have been added yet.'}
          </p>
          {!searchTerm && ( // Only show Add Farmer button if not searching
            <Button onClick={() => router.push('/farmers/new')}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Farmer
            </Button>
          )}
        </div>
      )}
      {/* Load More Button - Rendered only when not loading/searching and more data exists */}
      {!loading && !searching && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={loadMoreFarmers}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
