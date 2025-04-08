// src/components/farmers/FarmerCropActivitiesList.tsx
import React from 'react';
import { VisitCard } from '@/components/visits/VisitCard'; // Ensure this is the updated version
import { PurchaseCard } from '@/components/purchases/PurchaseCard'; // Ensure this is the updated version (with delete uncommented if needed, or kept commented)
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Plus } from 'lucide-react';
import { Visit, Purchase, Farmer, CropActivity, Crop } from '@/types';
import { useRouter } from 'next/navigation';

interface FarmerCropActivitiesListProps {
  activities: CropActivity[];
  farmer: Farmer;
  crop: Crop;
  activeTab: 'all' | 'visit' | 'purchase';
  onDeleteVisit: (id: string) => Promise<void>;
  onDeletePurchase: (id: string) => Promise<void>; // <-- UNCOMMENTED (assuming consistency)
  loadingVisitId: string | null;
  loadingPurchaseId: string | null; // <-- UNCOMMENTED (assuming consistency)
  // --- ADDED PROP ---
  onImageClick: (images: string[], startIndex: number) => void; // Function passed from parent to handle lightbox
}

export const FarmerCropActivitiesList: React.FC<
  FarmerCropActivitiesListProps
> = ({
  activities,
  farmer,
  crop,
  activeTab,
  onDeleteVisit,
  // onDeletePurchase, // <-- UNCOMMENTED
  loadingVisitId,
  // loadingPurchaseId, // <-- UNCOMMENTED
  onImageClick, // <-- ADDED Prop
}) => {
  const router = useRouter();

  // --- Render Empty State (Unchanged) ---
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
          // --- Pass onImageClick to VisitCard ---
          return (
            <VisitCard
              key={`visit-${activity.id}`}
              visit={activity.details as Visit}
              farmer={farmer}
              onDelete={onDeleteVisit}
              deleteLoading={loadingVisitId === activity.id}
              onImageClick={onImageClick} // <-- Pass handler down
            />
          );
        } else if (activity.type === 'purchase') {
          // --- Pass onImageClick to PurchaseCard ---
          return (
            <PurchaseCard
              key={`purchase-${activity.id}`}
              purchase={activity.details as Purchase}
              farmer={farmer}
              // onDelete={onDeletePurchase} // <-- Pass handler down (Uncommented)
              // deleteLoading={loadingPurchaseId === activity.id} // <-- Pass prop down (Uncommented)
              onImageClick={onImageClick} // <-- Pass handler down
            />
          );
        }
        return null;
      })}
    </div>
  );
};
