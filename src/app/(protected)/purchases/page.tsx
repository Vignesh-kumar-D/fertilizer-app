'use client';

import { useFirebase } from '@/lib/firebase/firebase-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  IndianRupee,
  Leaf,
  Loader2,
  Star,
  Edit,
  Trash,
  Image as ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import FormattedDate from '@/lib/FormattedDate';
import { Purchase, Farmer } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading purchases...</p>
      </div>
    );
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
          onCheckedChange={(checked: boolean) =>
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

          return (
            <Card
              key={purchase.id}
              className="hover:border-primary/50 transition-colors relative group"
            >
              <CardContent className="p-4">
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Purchase</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
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
                                This will permanently delete this purchase
                                record. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
                                onClick={() =>
                                  handleDeletePurchase(purchase.id)
                                }
                                disabled={deleteLoading === purchase.id}
                              >
                                {deleteLoading === purchase.id
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Purchase</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/purchases/${purchase.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium flex items-center">
                        {farmer.name}
                        {purchase.isWorkingCombo && (
                          <Star className="h-4 w-4 ml-1 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {farmer.location}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm">
                        <Leaf className="h-3 w-3 text-green-600" />
                        <span className="text-green-700">
                          {purchase.crop.name}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        <FormattedDate date={purchase.date} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-semibold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {purchase.totalAmount}
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-sm ${
                          purchase.remainingAmount <= 0
                            ? 'bg-green-100 text-green-800'
                            : purchase.amountPaid > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {purchase.remainingAmount > 0 ? 'Partial' : 'Paid'}
                      </div>
                    </div>
                  </div>

                  {purchase.images && purchase.images.length > 0 && (
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {purchase.images.length} photo
                      {purchase.images.length !== 1 && 's'}
                    </div>
                  )}

                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                        {purchase.items.split(',')[0]?.trim()}
                      </span>

                      {purchase.items.split(',').length > 1 && (
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          +{purchase.items.split(',').length - 1} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ₹{purchase.amountPaid}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due:</span>
                      <span className="ml-2 font-medium text-red-600">
                        ₹
                        {purchase.remainingAmount > 0
                          ? purchase.remainingAmount
                          : 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Qty (in litres):
                      </span>
                      <span className="ml-2 font-medium">
                        {purchase.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {filteredPurchases.length === 0 && (
        <div className="flex w-full mx-auto flex-col align-center">
          <div className="text-center py-8 text-muted-foreground col-span-full">
            {showWorkingCombosOnly
              ? 'No working combo purchases found'
              : 'No purchases found'}
          </div>
          <Button
            className="mt-4"
            onClick={() => router.push('/purchases/new')}
          >
            Add New Purchase
          </Button>
        </div>
      )}
    </div>
  );
}
