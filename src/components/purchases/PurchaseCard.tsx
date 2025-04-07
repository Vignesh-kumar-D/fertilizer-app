// src/components/purchases/PurchaseCard.tsx
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  //   Trash,
  ImageIcon,
  Calendar,
  ChevronRight,
  //   Loader2,
} from 'lucide-react';
import FormattedDate from '@/lib/FormattedDate'; // Assuming this component exists
import { Purchase, Farmer } from '@/types'; // Import your types
import { cn } from '@/lib/utils';

// Helper function (can be kept here or imported if used elsewhere)
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
  onDelete: (id: string) => Promise<void> | void; // Function to handle delete action
  deleteLoading: boolean; // Is this specific card's delete action loading?
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({
  purchase,
  farmer,
  //   onDelete,
  //   deleteLoading,
}) => {
  const router = useRouter();

  // Parse items to display as tags
  const itemsList = purchase.items
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow relative group"
      // Consider adding onClick={() => router.push(`/purchases/${purchase.id}`)} here if the whole card should navigate
      // Note: Clicks on buttons inside will need e.stopPropagation() if you do this.
    >
      {/* Image Section */}
      <div className="relative aspect-[16/9]">
        {purchase.images && purchase.images.length > 0 ? (
          <Image
            src={purchase.images[0]}
            alt={`Purchase from ${farmer.name}`}
            fill
            className="object-cover"
            onClick={() => router.push(`/purchases/${purchase.id}`)} // Make image clickable
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <div
            className="w-full h-full bg-muted flex flex-col items-center justify-center"
            onClick={() => router.push(`/purchases/${purchase.id}`)} // Make placeholder clickable
            style={{ cursor: 'pointer' }}
          >
            <ImageIcon className="h-16 w-16 text-muted-foreground opacity-40" />
            <div className="mt-2 px-4 py-1 rounded-full bg-muted-foreground/20">
              <Star className="h-4 w-4 inline mr-1 text-yellow-500" />
              <span className="text-sm font-medium">
                {purchase.isWorkingCombo ? 'Working Combo' : 'No Images'}
              </span>
            </div>
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
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Working Combo
            </Badge>
          </div>
        )}

        {/* Payment status badge */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <Badge
            className={cn(
              'text-base px-3 py-1.5 font-medium shadow-sm',
              purchase.remainingAmount <= 0
                ? 'bg-green-500 text-white'
                : purchase.amountPaid > 0
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white'
            )}
          >
            {purchase.remainingAmount <= 0
              ? 'PAID'
              : 'DUE: ' + formatCurrency(purchase.remainingAmount)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 pt-3">
        {/* Farmer Name and Actions */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="font-bold text-lg truncate flex-1 cursor-pointer"
            onClick={() => router.push(`/farmers/${farmer.id}`)}
          >
            {farmer.name}
          </div>

          {/* Edit/Delete buttons */}
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation(); // Needed if the whole card is clickable
                router.push(`/purchases/${purchase.id}/edit`);
              }}
              aria-label="Edit Purchase"
            >
              <Edit className="h-4 w-4" />
            </Button>

            {/* <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label="Delete Purchase"
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
                    This will permanently delete this purchase record from{' '}
                    {farmer.name}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => onDelete(purchase.id)}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog> */}
          </div>
        </div>

        {/* Items list */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {itemsList.slice(0, 3).map((item, index) => (
            <Badge key={index} variant="secondary" className="text-sm py-1">
              {item}
            </Badge>
          ))}
          {itemsList.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{itemsList.length - 3} more
            </Badge>
          )}
          {itemsList.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              No items listed
            </span>
          )}
        </div>

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
        <div className="mt-3 bg-muted/50 rounded-lg p-3 mb-2">
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
          className="w-full justify-between mt-1"
          onClick={() => router.push(`/purchases/${purchase.id}`)} // Links to detail view
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
