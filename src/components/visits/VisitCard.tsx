// src/components/visits/VisitCard.tsx
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Leaf,
  Edit,
  Trash,
  ImageIcon,
  Calendar,
  User,
  MapPin,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import FormattedDate from '@/lib/FormattedDate'; // Assuming this component exists
import { Visit, Farmer } from '@/types'; // Import your types
import { cn } from '@/lib/utils';

interface VisitCardProps {
  visit: Visit;
  farmer: Farmer;
  onDelete: (id: string) => Promise<void> | void; // Function to handle delete action
  deleteLoading: boolean; // Is this specific card's delete action loading?
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  farmer,
  onDelete,
  deleteLoading,
}) => {
  const router = useRouter();

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow relative group"
      // Consider adding onClick={() => router.push(`/visits/${visit.id}`)} for whole card navigation
      // Remember e.stopPropagation() on inner buttons if you do.
    >
      {/* Image Section */}
      <div className="relative aspect-[16/9]">
        {visit.images && visit.images.length > 0 ? (
          <Image
            src={visit.images[0]}
            alt={`Visit to ${farmer.name}'s farm`}
            fill
            className="object-cover"
            onClick={() => router.push(`/visits/${visit.id}`)} // Make image clickable
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <div
            className="w-full h-full bg-muted flex items-center justify-center"
            onClick={() => router.push(`/visits/${visit.id}`)} // Make placeholder clickable
            style={{ cursor: 'pointer' }}
          >
            <ImageIcon className="h-16 w-16 text-muted-foreground opacity-40" />
          </div>
        )}

        {/* Image count badge */}
        {visit.images && visit.images.length > 1 && (
          <Badge className="absolute bottom-2 right-2 bg-black/60 pointer-events-none">
            <ImageIcon className="h-3 w-3 mr-1" />
            {visit.images.length}
          </Badge>
        )}

        {/* Health indicator */}
        <div className="absolute top-2 right-2 pointer-events-none">
          <Badge
            className={cn(
              'text-white', // Ensure text is visible on colored backgrounds
              visit.cropHealth === 'good'
                ? 'bg-green-500'
                : visit.cropHealth === 'average'
                ? 'bg-yellow-500'
                : 'bg-red-500' // Default/poor
            )}
          >
            {/* Capitalize first letter */}
            {visit.cropHealth.charAt(0).toUpperCase() +
              visit.cropHealth.slice(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Crop Name and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center flex-1 min-w-0">
            {' '}
            {/* Added min-w-0 for proper truncation */}
            <Leaf className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
            <h3 className="font-bold text-xl truncate">{visit.crop.name}</h3>
          </div>

          {/* Edit/Delete buttons */}
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                // e.stopPropagation(); // Needed if the whole card is clickable
                router.push(`/visits/${visit.id}/edit`);
              }}
              aria-label="Edit Visit"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label="Delete Visit"
                >
                  {deleteLoading ? (
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
                    This will permanently delete this visit record for{' '}
                    {visit.crop.name} at {farmer.name}&apos;s farm. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => onDelete(visit.id)}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Farmer Info */}
        <div
          className="flex items-center text-sm mb-2 cursor-pointer"
          onClick={() => router.push(`/farmers/${farmer.id}`)}
        >
          <User className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{farmer.name}</span>
        </div>
        <div className="flex items-center text-sm mb-2">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground truncate">
            {farmer.location}
          </span>
        </div>
        <div className="flex items-center text-sm mb-3">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
          <FormattedDate date={visit.date} />
        </div>

        {/* Notes Section */}
        <div className="mt-3 mb-2">
          <div className="text-sm font-medium mb-1">Notes:</div>
          <p className="text-sm line-clamp-2 text-muted-foreground">
            {visit.notes || <span className="italic">No notes recorded.</span>}
          </p>
        </div>

        {/* Optionally add Recommendations if needed */}
        {/* <div className="mt-3 mb-2">
                    <div className="text-sm font-medium mb-1">Recommendations:</div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                        {visit.recommendations || <span className="italic">No recommendations.</span>}
                    </p>
                 </div> */}

        {/* View Details Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-between"
          onClick={() => router.push(`/visits/${visit.id}`)} // Links to detail view
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
