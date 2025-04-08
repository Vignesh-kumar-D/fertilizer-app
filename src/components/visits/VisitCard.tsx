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
  Expand, // <-- ADDED icon for hover effect
} from 'lucide-react';
import FormattedDate from '@/lib/FormattedDate'; // Assuming this component exists
import { Visit, Farmer } from '@/types'; // Import your types
import { cn } from '@/lib/utils';

interface VisitCardProps {
  visit: Visit;
  farmer: Farmer;
  onDelete: (id: string) => Promise<void> | void;
  deleteLoading: boolean;
  // --- ADDED PROP ---
  onImageClick: (images: string[], startIndex: number) => void; // Function to open lightbox
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  farmer,
  onDelete,
  deleteLoading,
  onImageClick, // <-- Destructure new prop
}) => {
  const router = useRouter();
  const hasImages = visit.images && visit.images.length > 0;

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow relative group border" // Added border, hover effect
    >
      {/* Image Section - Modified to be clickable */}
      <div className="relative aspect-[16/9]">
        {hasImages ? (
          // --- MODIFIED: Wrap Image in a button ---
          <button
            type="button"
            className="absolute inset-0 w-full h-full focus:outline-none group/img-btn rounded-t-lg overflow-hidden" // Button fills container
            onClick={() => onImageClick(visit.images, 0)} // Call parent handler
            aria-label={`View photos for visit on ${visit.date}`}
          >
            <Image
              src={visit.images[0]} // Show first image
              alt={`Visit to ${farmer.name}'s farm`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" // Optimized sizes
              className="object-cover transition-transform duration-300 group-hover/img-btn:scale-105" // Zoom effect
            />
            {/* Overlay with Expand Icon */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent group-hover/img-btn:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/img-btn:opacity-100">
              <Expand className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </button>
        ) : (
          // Placeholder - Non-clickable for lightbox
          <div
            className="w-full h-full bg-muted flex items-center justify-center"
            // Optional: Can still link placeholder to detail page if desired
            // onClick={() => router.push(`/visits/${visit.id}`)}
            // style={{ cursor: 'pointer' }}
          >
            <ImageIcon className="h-16 w-16 text-muted-foreground opacity-40" />
            <span className="absolute bottom-2 text-xs text-muted-foreground">
              No Images
            </span>{' '}
            {/* Added text */}
          </div>
        )}

        {/* Image count badge (Unchanged) */}
        {visit.images && visit.images.length > 1 && (
          <Badge className="absolute bottom-2 right-2 bg-black/60 pointer-events-none">
            <ImageIcon className="h-3 w-3 mr-1" />
            {visit.images.length}
          </Badge>
        )}

        {/* Health indicator (Unchanged) */}
        <div className="absolute top-2 right-2 pointer-events-none">
          <Badge className={cn(/* ...health badge styles... */)}>
            {visit.cropHealth.charAt(0).toUpperCase() +
              visit.cropHealth.slice(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Crop Name and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center flex-1 min-w-0">
            <Leaf className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
            <h3 className="font-bold text-xl truncate">{visit.crop.name}</h3>
          </div>

          {/* Edit/Delete buttons */}
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation(); // Prevent potential card click handler
                router.push(`/visits/${visit.id}/edit`);
              }}
              aria-label="Edit Visit"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  aria-label="Delete Visit"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          className="flex items-center text-sm mb-2 cursor-pointer hover:text-primary transition-colors" // Added hover
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

        {/* View Details Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-between text-primary hover:bg-accent"
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
};
