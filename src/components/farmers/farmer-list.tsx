'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Phone, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FarmerHeader } from './farmer-header';
import { useMockData } from '@/lib/mock-data-context';
import FormattedDate from '@/lib/FormattedDate';

export function FarmerList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { farmers } = useMockData();

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm) ||
      farmer.village.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <FarmerHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFarmers.map((farmer) => (
          <Card
            key={farmer.id}
            className="hover:border-primary/50 transition-colors"
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
                    <span>{farmer.village}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/farmers/${farmer.id}/edit`)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/farmers/${farmer.id}/visits`)}
                  className="text-primary"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
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

              <div className="mt-4 flex flex-wrap gap-2">
                {farmer.crops.map((crop) => (
                  <span
                    key={crop}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
