'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { FarmerHeader } from './farmer-header';
import FormattedDate from '@/lib/FormattedDate';
import { Badge } from '@/components/ui/badge';
import { Crop, Farmer } from '@/types';
import Image from 'next/image';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function FarmerList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { getFarmers, searchFarmers, deleteFarmer } = useFirebase();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial fetch of farmers
  const fetchInitialFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getFarmers();
      setFarmers(response.data);
      setLastDoc(response.lastDoc);
      setHasMore(response.data.length === 20); // Assuming 20 is the page size
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  }, [getFarmers]);
  useEffect(() => {
    fetchInitialFarmers();
  }, [fetchInitialFarmers]);

  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim() === '') {
        // Reset to initial state if search is cleared
        const response = await getFarmers();
        setFarmers(response.data);
        setLastDoc(response.lastDoc);
        setHasMore(response.data.length === 20);
        return;
      }

      setSearching(true);
      try {
        const results = await searchFarmers(searchTerm);
        setFarmers(results);
        setHasMore(false); // Search results don't support pagination in this implementation
      } catch (error) {
        console.error('Error searching farmers:', error);
      } finally {
        setSearching(false);
      }
    };

    // Use debounce to avoid too many requests while typing
    const debounceTimeout = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, getFarmers, searchFarmers]);

  // Load more farmers
  const loadMoreFarmers = async () => {
    if (!lastDoc || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await getFarmers(lastDoc);
      setFarmers((prev) => [...prev, ...response.data]);
      setLastDoc(response.lastDoc);
      setHasMore(response.data.length === 20); // Assuming 20 is the page size
    } catch (error) {
      console.error('Error loading more farmers:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  const handleDeleteFarmer = async (id: string) => {
    setLoading(true);

    try {
      await deleteFarmer(id);
      await fetchInitialFarmers();
    } catch {
      console.error('Error Deleting farmers:');
    } finally {
      setLoading(false);
    }
  };
  // Placeholder image for farmers without an image
  const placeholderImage = (name: string) => {
    const initials = name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="flex items-center justify-center bg-primary/10 rounded-full h-10 w-10 text-primary font-medium">
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <FarmerHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Loading State */}
      {(loading || searching) && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading farmers...</p>
        </div>
      )}

      {/* Farmers Grid */}
      {!loading && !searching && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmers.map((farmer) => (
            <Card
              key={farmer.id}
              className="hover:border-primary/50 transition-colors relative group cursor-pointer"
              onClick={() => router.push(`/farmers/${farmer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{farmer.name}</h3>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{farmer.phone}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{farmer.zone}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{farmer.location}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/farmers/${farmer.id}/edit`);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 
                     group-hover:text-red-500
                      group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFarmer(farmer.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {farmer.image ? (
                      <div className="relative">
                        <Image
                          src={farmer.image}
                          alt={farmer.name}
                          className="object-cover rounded-full h-10 w-10 border-2 border-gray-200"
                          width={40}
                          height={40}
                        />
                      </div>
                    ) : (
                      placeholderImage(farmer.name)
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
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

                <div className="mt-4">
                  <div className="flex items-center text-sm font-medium mb-2">
                    <Leaf className="h-4 w-4 mr-1 text-green-600" />
                    Crops
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {farmer.crops && farmer.crops.length > 0 ? (
                      farmer.crops.map((crop: Crop) => (
                        <Badge
                          key={crop.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/farmers/${farmer.id}/crop/${crop.id}`
                            );
                          }}
                        >
                          {crop.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No crops
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/visits/new?farmerId=${farmer.id}`);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Visit
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
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Purchase
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {farmers.length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {searchTerm ? 'No farmers match your search' : 'No farmers found'}
            </div>
          )}
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={loadMoreFarmers}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
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
