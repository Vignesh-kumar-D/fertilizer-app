'use client';

import { useMockData } from '@/lib/mock-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FarmerVisitsPage() {
  const router = useRouter();
  const { visits } = useMockData();

  if (!visits) {
    return <div>Visits not found</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Visits</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {visits.map((visit) => (
          <Card
            key={visit.id}
            className="hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() =>
              router.push(`/farmers/${visit.farmerId}/visits/${visit.id}`)
            }
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">
                    Visit Date: {new Date(visit.date).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Next Visit:{' '}
                    {new Date(visit.nextVisitDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div>
                  <h4 className="text-sm font-medium">Notes</h4>
                  <p className="text-muted-foreground line-clamp-2">
                    {visit.notes}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Recommendations</h4>
                  <p className="text-muted-foreground line-clamp-2">
                    {visit.recommendations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {visits.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No visits recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
