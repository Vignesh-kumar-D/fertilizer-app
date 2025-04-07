// src/components/farmers/FarmerCropHeader.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Leaf, Plus, IndianRupee } from 'lucide-react';
import { Farmer, Crop } from '@/types';

interface FarmerCropHeaderProps {
  farmer: Farmer;
  crop: Crop;
}

export const FarmerCropHeader: React.FC<FarmerCropHeaderProps> = ({
  farmer,
  crop,
}) => {
  const router = useRouter();
  const farmerId = farmer.id;
  const cropId = crop.id;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Left side: Back button, Farmer/Crop Info */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className="text-xl sm:text-2xl font-bold cursor-pointer hover:underline"
              onClick={() => router.push(`/farmers/${farmer.id}`)}
            >
              {farmer.name}
            </h1>
            <Badge variant="outline" className="font-normal text-sm">
              <Leaf className="h-3 w-3 mr-1 text-green-600" />
              {crop.name}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {farmer.location}
          </p>
        </div>
      </div>

      {/* Right side: Add Buttons */}
      <div className="flex gap-2 self-end sm:self-center">
        {/* Buttons for larger screens */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(`/visits/new?farmerId=${farmerId}&cropId=${cropId}`)
          }
          className="hidden sm:flex"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Visit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(`/purchases/new?farmerId=${farmerId}&cropId=${cropId}`)
          }
          className="hidden sm:flex"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Purchase
        </Button>
        {/* Buttons for smaller screens (Icons) */}
        <Button
          size="icon"
          variant="outline"
          title="Add Visit"
          onClick={() =>
            router.push(`/visits/new?farmerId=${farmerId}&cropId=${cropId}`)
          }
          className="sm:hidden"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          title="Add Purchase"
          onClick={() =>
            router.push(`/purchases/new?farmerId=${farmerId}&cropId=${cropId}`)
          }
          className="sm:hidden"
        >
          <IndianRupee className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
