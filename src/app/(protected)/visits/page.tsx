'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Visit, Farmer } from '@/types';
import FormattedDate from '@/lib/FormattedDate';
import { Calendar, ChevronRight, Leaf, MapPin, Plus, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ImageCarousel } from '@/components/shared/ImageCarousel';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/shared/loader';
// Helper function to determine crop health color
const getCropHealthColor = (health: string) => {
  switch (health) {
    case 'good':
      return 'bg-green-500';
    case 'average':
      return 'bg-yellow-500';
    case 'poor':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// Image Carousel Component

export default function VisitList() {
  const router = useRouter();
  const { getVisitsByFarmerId, getFarmers } = useFirebase();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // const [selectedFarmerId] = useState<string>('');
  // const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Fetch all visits
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First get all farmers
        const farmersResponse = await getFarmers();
        const farmersMap: Record<string, Farmer> = {};

        // Create a map of farmers for quick lookup
        farmersResponse.data.forEach((farmer) => {
          farmersMap[farmer.id] = farmer;
        });

        setFarmers(farmersMap);

        // Then fetch visits for selected farmer or all visits
        let allVisits: Visit[] = [];

        // if (selectedFarmerId) {
        //   allVisits = await getVisitsByFarmerId(selectedFarmerId);
        // } else {
        // Fetch visits for each farmer
        const visitPromises = farmersResponse.data.map((farmer) =>
          getVisitsByFarmerId(farmer.id)
        );

        const visitsArrays = await Promise.all(visitPromises);
        allVisits = visitsArrays.flat();
        // }

        // Sort visits by date (newest first)
        allVisits.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setVisits(allVisits);
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getFarmers, getVisitsByFarmerId]);

  // Filter visits based on search term
  const filteredVisits = visits.filter((visit) => {
    const farmer = farmers[visit.farmerId];
    if (!farmer) return false;

    const searchLower = searchTerm.toLowerCase();

    return (
      farmer.name.toLowerCase().includes(searchLower) ||
      farmer.location.toLowerCase().includes(searchLower) ||
      visit.crop.name.toLowerCase().includes(searchLower) ||
      visit.notes.toLowerCase().includes(searchLower) ||
      visit.recommendations.toLowerCase().includes(searchLower)
    );
  });

  // const handleDeleteVisit = async (id: string) => {
  //   if (window.confirm('Are you sure you want to delete this visit?')) {
  //     setDeleteLoading(id);
  //     try {
  //       await deleteVisit(id);
  //       setVisits((prev) => prev.filter((visit) => visit.id !== id));
  //       toast.success('Visit deleted successfully');
  //     } catch (error) {
  //       console.error('Error deleting visit:', error);
  //       toast.error('Failed to delete visit');
  //     } finally {
  //       setDeleteLoading(null);
  //     }
  //   }
  // };
  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visits</h1>
          <p className="text-muted-foreground">
            Manage all field visit records
          </p>
        </div>
        <div className="flex gap-4">
          <Input
            placeholder="Search visits..."
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVisits.map((visit) => {
          const farmer = farmers[visit.farmerId];

          if (!farmer) return null;

          return (
            <Card
              key={visit.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image Carousel */}
              {visit.images && visit.images.length > 0 ? (
                <ImageCarousel images={visit.images} />
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-muted-foreground">No images</p>
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium flex items-center">
                      <Leaf className="h-4 w-4 mr-1 text-green-600" />
                      {visit.crop.name}
                      <span
                        className={cn(
                          'ml-2 h-2 w-2 rounded-full',
                          getCropHealthColor(visit.cropHealth)
                        )}
                      />
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <FormattedDate date={visit.date} />
                    </div>
                  </div>

                  {/* <div className="flex space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/visits/${visit.id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Visit</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVisit(visit.id);
                            }}
                            disabled={deleteLoading === visit.id}
                          >
                            {deleteLoading === visit.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Visit</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div> */}
                </div>

                <div className="flex items-center text-sm mt-3">
                  <User className="h-3 w-3 mr-1" />
                  <span className="font-medium mr-1">Farmer:</span>
                  <span>{farmer.name}</span>
                </div>

                <div className="flex items-center text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{farmer.location}</span>
                </div>

                <div className="mt-3">
                  <p className="text-sm line-clamp-2 text-muted-foreground">
                    {visit.notes}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/visits/${visit.id}`);
                  }}
                >
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {filteredVisits.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No visits found</p>
            <Button className="mt-4" onClick={() => router.push('/visits/new')}>
              Add New Visit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
