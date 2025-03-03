// src/app/purchases/page.tsx
'use client';

import { useFirebase } from '@/lib/firebase/firebase-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, IndianRupee, Leaf, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import FormattedDate from '@/lib/FormattedDate';
import { Purchase, Farmer } from '@/types';

export default function PurchasesPage() {
  const router = useRouter();
  const { getFarmers, getPurchasesByFarmerId } = useFirebase();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Get purchases by farmer ID - this would normally be in your Firebase context

  // Filter purchases based on search term
  const filteredPurchases = purchases.filter((purchase) => {
    const farmer = farmers[purchase.farmerId];
    if (!farmer) return false;

    const searchLower = searchTerm.toLowerCase();

    return (
      farmer.name.toLowerCase().includes(searchLower) ||
      farmer.location.toLowerCase().includes(searchLower) ||
      purchase.crop.name.toLowerCase().includes(searchLower) ||
      purchase.items.toLowerCase().includes(searchLower)
    );
  });

  // Get farmer by ID - replicating the mock data function
  const getFarmerById = (farmerId: string): Farmer | null => {
    return farmers[farmerId] || null;
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPurchases.map((purchase) => {
          const farmer = getFarmerById(purchase.farmerId);
          if (!farmer) return null;

          return (
            <Card
              key={purchase.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/purchases/${purchase.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{farmer.name}</div>
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

                <div className="mt-2">
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                      {purchase.items}
                    </span>

                    {purchase.items.length > 2 && (
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                        +{purchase.items.length - 2} more
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
              </CardContent>
            </Card>
          );
        })}

        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground col-span-full">
            No purchases found
          </div>
        )}
      </div>
    </div>
  );
}
