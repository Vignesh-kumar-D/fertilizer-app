// src/components/purchases/PurchaseCard.tsx
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// --- Keep AlertDialog imports commented out ---
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog';
import {
  Leaf,
  Star,
  Edit,
  // Trash, // <-- Keep commented
  ImageIcon,
  Calendar,
  ChevronRight,
  // Loader2, // <-- Keep commented
  Expand, // <-- Keep: Used for image hover effect
} from 'lucide-react';
import FormattedDate from '@/lib/FormattedDate'; // Assuming this component exists
import { Purchase, Farmer } from '@/types'; // Import your types
import { cn } from '@/lib/utils';

// Helper function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface PurchaseCardProps {
  purchase: Purchase;
  farmer: Farmer;
  // --- Keep delete props commented out ---
  // onDelete: (id: string) => Promise<void> | void;
  // deleteLoading: boolean;
  onImageClick: (images: string[], startIndex: number) => void; // Function to open lightbox
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({
  purchase,
  farmer,
  // --- Keep delete props commented out ---
  // onDelete,
  // deleteLoading,
  onImageClick,
}) => {
  const router = useRouter();
  const hasImages = purchase.images && purchase.images.length > 0;

  // Parse items list
  const itemsList =
    purchase.items
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) || []; // Handle potential undefined/empty string

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow relative group border flex flex-col" // Added flex flex-col
    >
      {/* Image Section - Clickable if images exist */}
      <div className="relative aspect-[16/9]">
        {hasImages ? (
          <button
            type="button"
            className="absolute inset-0 w-full h-full focus:outline-none group/img-btn rounded-t-lg overflow-hidden"
            onClick={() => onImageClick(purchase?.images ?? [], 0)}
            aria-label={`View photos for purchase on ${purchase.date}`}
          >
            <Image
              src={purchase?.images?.[0] ?? ''}
              alt={`Purchase from ${farmer.name}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover/img-btn:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent group-hover/img-btn:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/img-btn:opacity-100">
              <Expand className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </button>
        ) : (
          // Placeholder
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center rounded-t-lg">
            {' '}
            {/* Added rounding */}
            <ImageIcon className="h-16 w-16 text-muted-foreground opacity-40" />
            {purchase.isWorkingCombo && (
              <div className="mt-2 px-4 py-1 rounded-full bg-muted-foreground/20">
                <Star className="h-4 w-4 inline mr-1 text-yellow-500" />
                <span className="text-sm font-medium">Working Combo</span>
              </div>
            )}
            {!purchase.isWorkingCombo && (
              <span className="text-sm font-medium mt-2 text-muted-foreground">
                No Images
              </span>
            )}
          </div>
        )}

        {/* Image count badge */}
        {purchase.images && purchase.images.length > 1 && (
          <Badge className="absolute bottom-2 right-2 bg-black/60 pointer-events-none">
            <ImageIcon className="h-3 w-3 mr-1" />
            {purchase.images.length}
          </Badge>
        )}

        {/* Working combo star */}
        {purchase.isWorkingCombo && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <Badge className="bg-yellow-500 text-white shadow">
              <Star className="h-3 w-3 mr-1" /> Working Combo
            </Badge>
          </div>
        )}

        {/* Payment status badge */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <Badge className={cn(/* ...payment styles... */)}>
            {purchase.remainingAmount <= 0
              ? 'PAID'
              : 'DUE: ' + formatCurrency(purchase.remainingAmount)}
          </Badge>
        </div>
      </div>

      {/* Card Content - Added flex-grow */}
      <CardContent className="p-4 pt-3 flex flex-col flex-grow">
        {/* Farmer Name and Actions */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="font-bold text-lg truncate flex-1 cursor-pointer hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/farmers/${farmer.id}`);
            }}
          >
            {farmer.name}
          </div>
          {/* Edit Button */}
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/purchases/${purchase.id}/edit`);
              }}
              aria-label="Edit Purchase"
            >
              {' '}
              <Edit className="h-4 w-4" />{' '}
            </Button>
            {/* Delete Button remains commented out */}
          </div>
        </div>

        {/* === MODIFIED ITEMS LIST SECTION === */}
        <div className="mb-4">
          {' '}
          {/* Container for the items section */}
          <div className="text-xs font-medium mb-1.5 text-muted-foreground">
            Items Purchased:
          </div>
          {/* Scrollable container with max height for ~3 lines */}
          <div className="max-h-[4.5rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted/50 scrollbar-track-transparent">
            {/* Adjust max-h-[4.5rem] (72px) if your line height differs significantly */}
            {itemsList.length > 0 ? (
              // Map over ALL items
              itemsList.map((item, index) => (
                // Display each item as a paragraph
                <p
                  key={index}
                  className="text-sm font-semibold text-foreground mb-1 break-words last:mb-0" // Style: Bold, black, spacing, word break
                >
                  {item}
                </p>
              ))
            ) : (
              // Empty state
              <span className="text-sm text-muted-foreground italic">
                No specific items listed.
              </span>
            )}
          </div>
        </div>
        {/* === END OF MODIFIED ITEMS LIST SECTION === */}

        {/* Crop and date */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center text-sm">
            <Leaf className="h-4 w-4 mr-1 text-green-600 flex-shrink-0" />
            <span className="text-green-700 font-medium truncate">
              {purchase.crop.name}
            </span>
          </div>
          <div className="flex items-center text-sm justify-end">
            <Calendar className="h-4 w-4 mr-1 text-muted-foreground flex-shrink-0" />
            <FormattedDate date={purchase.date} />
          </div>
        </div>

        {/* Financial details */}
        <div className="mt-auto bg-muted/50 rounded-lg p-3 mb-2">
          {' '}
          {/* Added mt-auto to push down */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-bold text-lg">
                {formatCurrency(purchase.totalAmount)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Due</div>
              <div
                className={cn(
                  'font-bold text-lg',
                  purchase.remainingAmount > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                )}
              >
                {formatCurrency(
                  purchase.remainingAmount > 0 ? purchase.remainingAmount : 0
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <div>
              <span className="text-muted-foreground">Paid:</span>
              <span className="ml-1 font-medium text-green-600">
                {formatCurrency(purchase.amountPaid)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Qty:</span>
              <span className="ml-1 font-medium">{purchase.quantity}L</span>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between mt-1 text-primary hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/purchases/${purchase.id}`);
          }}
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
