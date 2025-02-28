// src/app/visits/page.tsx
'use client';

import { useMockData } from '@/lib/mock-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Image as ImageIcon, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import FormattedDate from '@/lib/FormattedDate';

export default function VisitsPage() {
  const router = useRouter();
  const { visits, getFarmerById } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVisits = visits.filter((visit) => {
    const farmer = getFarmerById(visit.farmerId);
    const searchLower = searchTerm.toLowerCase();

    return (
      farmer?.name.toLowerCase().includes(searchLower) ||
      farmer?.location.toLowerCase().includes(searchLower) ||
      visit.crop.name.toLowerCase().includes(searchLower) ||
      visit.notes.toLowerCase().includes(searchLower) ||
      visit.recommendations.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visits</h1>
          <p className="text-muted-foreground">
            Manage all field visit records
          </p>
        </div>
        <div className="flex gap-4">
          <Input
            placeholder="Search visits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[300px]"
          />
          <Button
            onClick={() => router.push('/visits/new')}
            className="bg-primary text-primary-foreground whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Visit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVisits.map((visit) => {
          const farmer = getFarmerById(visit.farmerId);

          return (
            <Card
              key={visit.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/visits/${visit.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{farmer?.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {farmer?.location}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <Leaf className="h-3 w-3 text-green-600" />
                      <span className="text-green-700">{visit.crop.name}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <FormattedDate date={visit.date} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {visit.images?.length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm">{visit.images.length}</span>
                      </div>
                    )}
                    <div
                      className={`px-2 py-1 rounded-full text-sm ${
                        visit.cropHealth === 'good'
                          ? 'bg-green-100 text-green-800'
                          : visit.cropHealth === 'average'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {visit.cropHealth.charAt(0).toUpperCase() +
                        visit.cropHealth.slice(1)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Notes
                    </h4>
                    <p className="text-sm line-clamp-1">{visit.notes}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Next Visit
                    </h4>
                    <p className="text-sm">
                      <FormattedDate date={visit.nextVisitDate} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredVisits.length === 0 && (
          <div className="text-center py-8 text-muted-foreground col-span-full">
            No visits found
          </div>
        )}
      </div>
    </div>
  );
}
