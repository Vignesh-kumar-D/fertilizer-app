// src/components/farmers/FarmerCropActivitiesList.tsx
import React from 'react';
import { VisitCard } from '@/components/visits/VisitCard'; // Import VisitCard
import { PurchaseCard } from '@/components/purchases/PurchaseCard'; // Import PurchaseCard
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Plus } from 'lucide-react';
import { Visit, Purchase, Farmer, CropActivity, Crop } from '@/types';
import { useRouter } from 'next/navigation';

interface FarmerCropActivitiesListProps {
  activities: CropActivity[]; // The filtered list from the parent
  farmer: Farmer;
  crop: Crop; // Pass crop for context in empty state actions
  activeTab: 'all' | 'visit' | 'purchase'; // To tailor empty state message
  onDeleteVisit: (id: string) => Promise<void>;
  onDeletePurchase: (id: string) => Promise<void>;
  loadingVisitId: string | null; // ID of visit being deleted
  loadingPurchaseId: string | null; // ID of purchase being deleted
}

export const FarmerCropActivitiesList: React.FC<
  FarmerCropActivitiesListProps
> = ({
  activities,
  farmer,
  crop,
  activeTab,
  onDeleteVisit,
  onDeletePurchase,
  loadingVisitId,
  loadingPurchaseId,
}) => {
  const router = useRouter();

  // --- Render Empty State ---
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 py-10 text-center">
          <History className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No activities found</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            There are no{' '}
            {activeTab === 'all'
              ? 'activities'
              : activeTab === 'visit'
              ? 'visits'
              : 'purchases'}{' '}
            recorded for {crop.name} on this farm matching the current filter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Button
              onClick={() =>
                router.push(
                  `/visits/new?farmerId=${farmer.id}&cropId=${crop.id}`
                )
              }
              className="bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Visit Record
            </Button>
            <Button
              onClick={() =>
                router.push(
                  `/purchases/new?farmerId=${farmer.id}&cropId=${crop.id}`
                )
              }
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Purchase Record
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Render Grid of Detailed Cards ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map((activity) => {
        if (activity.type === 'visit') {
          return (
            <VisitCard
              key={`visit-${activity.id}`}
              visit={activity.details as Visit}
              farmer={farmer}
              onDelete={onDeleteVisit}
              deleteLoading={loadingVisitId === activity.id}
            />
          );
        } else if (activity.type === 'purchase') {
          return (
            <PurchaseCard
              key={`purchase-${activity.id}`}
              purchase={activity.details as Purchase}
              farmer={farmer}
              onDelete={onDeletePurchase}
              deleteLoading={loadingPurchaseId === activity.id}
            />
          );
        }
        return null; // Should not happen if type is always 'visit' or 'purchase'
      })}
    </div>
  );
};
