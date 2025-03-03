'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IndianRupee, ArrowLeft, Loader2, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Farmer } from '@/types';
import FormattedDate from '@/lib/FormattedDate';

export default function PendingDuesPage() {
  const router = useRouter();
  const { getFarmers } = useFirebase();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFarmers = async () => {
      setLoading(true);
      try {
        const response = await getFarmers();

        // Filter farmers with pending dues and sort by amount (highest first)
        const farmersWithDues = response.data
          .filter((farmer) => (farmer.totalDue || 0) > 0)
          .sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0));

        setFarmers(farmersWithDues);
      } catch (error) {
        console.error('Error fetching farmers with dues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, [getFarmers]);

  // Filter farmers based on search term
  const filteredFarmers = farmers.filter((farmer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      farmer.name.toLowerCase().includes(searchLower) ||
      farmer.location.toLowerCase().includes(searchLower) ||
      farmer.phone.includes(searchTerm)
    );
  });

  // Calculate total pending amount
  const totalPendingAmount = filteredFarmers.reduce(
    (sum, farmer) => sum + (farmer.totalDue || 0),
    0
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Loading farmers with pending dues...
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pending Dues</h1>
          <p className="text-muted-foreground">
            {filteredFarmers.length} farmers with pending payments
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="bg-white p-4 rounded-lg border w-full sm:w-auto">
          <p className="text-sm text-muted-foreground">Total Pending Amount</p>
          <div className="flex items-center">
            <IndianRupee className="h-5 w-5 text-red-600 mr-1" />
            <span className="text-2xl font-bold text-red-600">
              {totalPendingAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search farmers..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2.5"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredFarmers.length > 0 ? (
          filteredFarmers.map((farmer) => (
            <Card
              key={farmer.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/farmers/${farmer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <div className="font-medium text-lg">{farmer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {farmer.location}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {farmer.phone}
                    </div>
                    <div className="mt-2 text-sm">
                      Last Visit: <FormattedDate date={farmer.lastVisitDate} />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 sm:text-right w-full sm:w-auto">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Due Amount
                      </div>
                      <div className="text-xl font-semibold text-red-600">
                        ₹{(farmer.totalDue || 0).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">
                        Paid Amount
                      </div>
                      <div className="text-lg font-medium text-green-600">
                        ₹{(farmer.totalPaid || 0).toLocaleString()}
                      </div>
                    </div>

                    <Button
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/purchases/new?farmerId=${farmer.id}`);
                      }}
                    >
                      <IndianRupee className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No farmers found with matching criteria
          </div>
        )}
      </div>
    </div>
  );
}
