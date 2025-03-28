'use client';

import { useFirebase } from '@/lib/firebase/firebase-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Leaf,
  Loader2,
  Star,
  Edit,
  Trash,
  ImageIcon,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import FormattedDate from '@/lib/FormattedDate';
import { Purchase, Farmer } from '@/types';
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
import { cn } from '@/lib/utils';
import { PageLoader } from '@/components/shared/loader';
import Image from 'next/image';

export default function PurchasesPage() {
  const router = useRouter();
  const { getFarmers, getPurchasesByFarmerId, deletePurchase } = useFirebase();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWorkingCombosOnly, setShowWorkingCombosOnly] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Fetch all data on page load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all farmers for lookup
        const farmersResponse = await getFarmers();
        const farmersMap: Record<string, Farmer> = {};

        farmersResponse.data.forEach((farmer) => {
          farmersMap[farmer.id] = farmer;
        });

        setFarmers(farmersMap);

        // Get all purchases from each farmer
        const allPurchases: Purchase[] = [];

        // For each farmer, get their purchases
        const purchasesPromises = farmersResponse.data.map(async (farmer) => {
          try {
            const farmerPurchases = await getPurchasesByFarmerId(farmer.id);
            return farmerPurchases;
          } catch (error) {
            console.error(
              `Error fetching purchases for farmer ${farmer.id}:`,
              error
            );
            return [];
          }
        });

        const purchasesResults = await Promise.all(purchasesPromises);
        purchasesResults.forEach((farmerPurchases) => {
          allPurchases.push(...farmerPurchases);
        });

        // Sort purchases by date (newest first)
        allPurchases.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setPurchases(allPurchases);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getFarmers, getPurchasesByFarmerId]);

  // Filter purchases based on search term and working combo filter
  const filteredPurchases = purchases.filter((purchase) => {
    const farmer = farmers[purchase.farmerId];
    if (!farmer) return false;

    // Check working combo filter first
    if (showWorkingCombosOnly && !purchase.isWorkingCombo) {
      return false;
    }

    // Then check search term
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    return (
      farmer.name.toLowerCase().includes(searchLower) ||
      farmer.location.toLowerCase().includes(searchLower) ||
      purchase.crop.name.toLowerCase().includes(searchLower) ||
      purchase.items.toLowerCase().includes(searchLower)
    );
  });

  // Get farmer by ID
  const getFarmerById = (farmerId: string): Farmer | null => {
    return farmers[farmerId] || null;
  };

  const handleDeletePurchase = async (id: string) => {
    setDeleteLoading(id);
    try {
      await deletePurchase(id);
      setPurchases((prev) => prev.filter((purchase) => purchase.id !== id));
      toast.success('Purchase deleted successfully');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete purchase');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">Manage all purchase records</p>
        </div>
        <div className="flex gap-4">
          <Input
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[300px]"
          />
          <Button
            onClick={() => router.push('/purchases/new')}
            className="bg-primary text-primary-foreground whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="working-combos"
          checked={showWorkingCombosOnly}
          onCheckedChange={(checked) =>
            setShowWorkingCombosOnly(checked === true)
          }
        />
        <label
          htmlFor="working-combos"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center cursor-pointer"
        >
          <Star className="h-4 w-4 mr-1 text-yellow-500 inline" />
          Show Working Combos Only
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPurchases.map((purchase) => {
          const farmer = getFarmerById(purchase.farmerId);
          if (!farmer) return null;

          // Parse items to display as tags
          const itemsList = purchase.items
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          return (
            <Card
              key={purchase.id}
              className="overflow-hidden hover:shadow-md transition-shadow relative group"
            >
              {/* Image Section - Larger */}
              <div className="relative aspect-[16/9] cursor-pointer">
                {purchase.images && purchase.images.length > 0 ? (
                  <Image
                    src={purchase.images[0]}
                    alt={`Purchase from ${farmer.name}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground opacity-40" />
                    <div className="mt-2 px-4 py-1 rounded-full bg-muted-foreground/20">
                      <Star className="h-4 w-4 inline mr-1 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {purchase.isWorkingCombo
                          ? 'Working Combo'
                          : 'No Images'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Image count badge */}
                {purchase.images && purchase.images.length > 1 && (
                  <Badge className="absolute bottom-2 right-2 bg-black/60">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {purchase.images.length}
                  </Badge>
                )}

                {/* Working combo star */}
                {purchase.isWorkingCombo && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Working Combo
                    </Badge>
                  </div>
                )}

                {/* Payment status badge - Larger and more prominent */}
                <div className="absolute top-3 right-3 z-10">
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
                {/* Items list - Prominent */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg truncate flex-1">
                      {farmer.name}
                    </div>

                    {/* Edit/Delete buttons - Beside farmer name */}
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/purchases/${purchase.id}/edit`);
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
                            {deleteLoading === purchase.id ? (
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
                              This will permanently delete this purchase record.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => handleDeletePurchase(purchase.id)}
                              disabled={deleteLoading === purchase.id}
                            >
                              {deleteLoading === purchase.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {itemsList.slice(0, 3).map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm py-1"
                      >
                        {item}
                      </Badge>
                    ))}
                    {itemsList.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{itemsList.length - 3} more
                      </Badge>
                    )}
                  </div>
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

                {/* Financial details - Highlighted */}
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
                          purchase.remainingAmount > 0
                            ? purchase.remainingAmount
                            : 0
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
                      <span className="ml-1 font-medium">
                        {purchase.quantity}L
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between mt-1"
                  onClick={() => router.push(`/purchases/${purchase.id}`)}
                >
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground col-span-full">
            {showWorkingCombosOnly
              ? 'No working combo purchases found'
              : 'No purchases found'}
            <Button
              className="mt-4"
              onClick={() => router.push('/purchases/new')}
            >
              Add New Purchase
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
