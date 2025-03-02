// src/app/purchases/[id]/page.tsx
'use client';

import { useMockData } from '@/lib/mock-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, IndianRupee, Tag } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import FormattedDate from '@/lib/FormattedDate';

export default function PurchaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getPurchaseById, getFarmerById } = useMockData();

  const purchase = getPurchaseById(id);
  const farmer = purchase ? getFarmerById(purchase.farmerId) : null;

  if (!purchase || !farmer) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Purchase not found</h1>
        <Button onClick={() => router.push('/purchases')}>
          Back to Purchases
        </Button>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (purchase.remainingAmount === 0) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          Paid
        </Badge>
      );
    } else if (purchase.amountPaid > 0) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          Partial
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          Pending
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Purchase Details</h1>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Purchase Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                </div>
              </div>
              <FormattedDate date={purchase.date} />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Total Amount:</span>
                </div>
                <span className="font-medium">₹{purchase.totalAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Amount Paid:</span>
                </div>
                <span className="font-medium text-green-600">
                  ₹{purchase.amountPaid}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">
                    Remaining Amount:
                  </span>
                </div>
                <span className="font-medium text-red-600">
                  ₹{purchase.remainingAmount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Payment Status:</span>
                </div>
                {getStatusBadge()}
              </div>
              <div className="flex justify-between items-center"></div>
            </div>
          </CardContent>
        </Card>

        {/* Farmer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Farmer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-4 cursor-pointer hover:bg-muted/10 p-2 rounded-md transition-colors"
              onClick={() => router.push(`/farmers/${farmer.id}`)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">{farmer.name}</span>
                <Badge variant="outline">{farmer.location}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Phone:</span>
                <span>{farmer.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Due:</span>
                <span className="font-medium text-red-600">
                  ₹{farmer.totalDue}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span>{purchase.items}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {purchase.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{purchase.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
