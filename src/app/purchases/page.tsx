// src/app/purchases/page.tsx
'use client';

import { useMockData } from '@/lib/mock-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function PurchasesPage() {
  const router = useRouter();
  const { purchases, getFarmerById } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurchases = purchases.filter((purchase) => {
    const farmer = getFarmerById(purchase.farmerId);
    const searchLower = searchTerm.toLowerCase();

    return (
      farmer?.name.toLowerCase().includes(searchLower) ||
      farmer?.village.toLowerCase().includes(searchLower) ||
      purchase.items.some((item) => item.toLowerCase().includes(searchLower))
    );
  });

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

      <div className="grid gap-4">
        {filteredPurchases.map((purchase) => {
          const farmer = getFarmerById(purchase.farmerId);

          return (
            <Card
              key={purchase.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/purchases/${purchase.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{farmer?.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {farmer?.village}
                    </div>
                    <div className="text-sm mt-1">
                      {new Date(purchase.date).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {purchase.items.map((item, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-semibold flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {purchase.totalAmount}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-sm ${
                        purchase.remainingAmount === 0
                          ? 'bg-green-100 text-green-800'
                          : purchase.amountPaid > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {purchase.remainingAmount === 0
                        ? 'Paid'
                        : purchase.amountPaid > 0
                        ? 'Partial'
                        : 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="ml-2 font-medium text-green-600">
                      ₹{purchase.amountPaid}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="ml-2 font-medium text-red-600">
                      ₹{purchase.remainingAmount}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <span className="ml-2 capitalize">
                      {purchase.paymentMode}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No purchases found
          </div>
        )}
      </div>
    </div>
  );
}
