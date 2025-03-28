'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Visit, Farmer } from '@/types';
import FormattedDate from '@/lib/FormattedDate';
import {
  Calendar,
  ChevronRight,
  Edit,
  Leaf,
  Loader2,
  MapPin,
  Plus,
  Trash,
  User,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/shared/loader';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Helper function to determine crop health color
// const getCropHealthColor = (health: string) => {
//   switch (health) {
//     case 'good':
//       return 'bg-green-500';
//     case 'average':
//       return 'bg-yellow-500';
//     case 'poor':
//       return 'bg-red-500';
//     default:
//       return 'bg-gray-500';
//   }
// };

export default function VisitList() {
  const router = useRouter();
  const { getVisitsByFarmerId, getFarmers, deleteVisit } = useFirebase();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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

        // Fetch visits for each farmer
        const visitPromises = farmersResponse.data.map((farmer) =>
          getVisitsByFarmerId(farmer.id)
        );

        const visitsArrays = await Promise.all(visitPromises);
        allVisits = visitsArrays.flat();

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

  const handleDeleteVisit = async (id: string) => {
    setDeleteLoading(id);
    try {
      await deleteVisit(id);
      setVisits((prev) => prev.filter((visit) => visit.id !== id));
      toast.success('Visit deleted successfully');
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Failed to delete visit');
    } finally {
      setDeleteLoading(null);
    }
  };

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
              className="overflow-hidden hover:shadow-md transition-shadow relative group"
            >
              {/* Image Section - 50% of card height */}
              <div className="relative aspect-[16/9] cursor-pointer">
                {visit.images && visit.images.length > 0 ? (
                  <Image
                    src={visit.images[0]}
                    alt={`Visit to ${farmer.name}'s farm`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground opacity-40" />
                  </div>
                )}

                {/* Image count badge */}
                {visit.images && visit.images.length > 1 && (
                  <Badge className="absolute bottom-2 right-2 bg-black/60">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {visit.images.length}
                  </Badge>
                )}

                {/* Health indicator */}
                <div className="absolute top-2 right-2">
                  <Badge
                    className={cn(
                      'text-white',
                      visit.cropHealth === 'good'
                        ? 'bg-green-500'
                        : visit.cropHealth === 'average'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    )}
                  >
                    {visit.cropHealth.charAt(0).toUpperCase() +
                      visit.cropHealth.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Edit/Delete buttons - Removed from floating over image */}

              <CardContent className="p-4">
                {/* Crop name - Large and bold with action buttons */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <Leaf className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                    <h3 className="font-bold text-xl truncate">
                      {visit.crop.name}
                    </h3>
                  </div>

                  {/* Edit/Delete buttons beside crop name */}
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
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

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          {deleteLoading === visit.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this visit record. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => handleDeleteVisit(visit.id)}
                            disabled={deleteLoading === visit.id}
                          >
                            {deleteLoading === visit.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Farmer info */}
                <div className="flex items-center text-sm mb-2">
                  <User className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">{farmer.name}</span>
                </div>

                <div className="flex items-center text-sm mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{farmer.location}</span>
                </div>

                <div className="flex items-center text-sm mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <FormattedDate date={visit.date} />
                </div>

                <div className="mt-3 mb-2">
                  <div className="text-sm font-medium mb-1">Notes:</div>
                  <p className="text-sm line-clamp-2 text-muted-foreground">
                    {visit.notes}
                  </p>
                </div>

                {/* View Details Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-between"
                  onClick={() => router.push(`/visits/${visit.id}`)}
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
