'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Phone, MapPin, Plus, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FarmerHeader } from './farmer-header';
import { useMockData } from '@/lib/mock-data-context';
import FormattedDate from '@/lib/FormattedDate';
import { Badge } from '@/components/ui/badge';
import { Crop } from '@/types';
import Image from 'next/image';
export function FarmerList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { farmers } = useMockData();

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm) ||
      farmer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.crops.some((crop) =>
        crop.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="space-y-4">
      <FarmerHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFarmers.map((farmer) => (
          <Card
            key={farmer.id}
            className="hover:border-primary/50 transition-colors relative group"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{farmer.name}</h3>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{farmer.phone}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{farmer.location}</span>
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/farmers/${farmer.id}/edit`)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {farmer.image && (
                    <div className="relative rounded-full">
                      <Image
                        src={farmer.image}
                        alt={farmer.name}
                        className="object-cover rounded-full h-20 w-20 border-2 border-gray-200"
                        width={40}
                        height={40}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Due:</span>
                  <span className="font-medium text-destructive">
                    ₹{farmer.totalDue}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-medium text-primary">
                    ₹{farmer.totalPaid}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Visit:</span>
                  <FormattedDate date={farmer.lastVisitDate} />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center text-sm font-medium mb-2">
                  <Leaf className="h-4 w-4 mr-1 text-green-600" />
                  Crops
                </div>
                <div className="flex flex-wrap gap-2">
                  {farmer.crops.map((crop: Crop) => (
                    <Badge
                      key={crop.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/farmers/${farmer.id}/crop/${crop.id}`);
                      }}
                    >
                      {crop.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/visits/new?farmerId=${farmer.id}`);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Visit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/purchases/new?farmerId=${farmer.id}`);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFarmers.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No farmers found
          </div>
        )}
      </div>
    </div>
  );
}
