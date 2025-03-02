// src/components/farmer/FarmerCropActivities.tsx
'use client';

import { useMemo, useState } from 'react';
import { useMockData } from '@/lib/mock-data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Leaf,
  Calendar,
  IndianRupee,
  Image as ImageIcon,
  Plus,
  History,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import FormattedDate from '@/lib/FormattedDate';
import { Visit, Purchase } from '@/types';

// Properly typed CropActivity interface
interface CropActivity {
  id: string;
  type: 'visit' | 'purchase';
  date: string;
  details: Visit | Purchase;
}

interface FarmerCropActivitiesProps {
  farmerId: string;
  cropId: string;
}

export default function FarmerCropActivities({
  farmerId,
  cropId,
}: FarmerCropActivitiesProps) {
  const router = useRouter();
  const { getFarmerById, getCropById, getFarmerCropActivities } = useMockData();
  const [activeTab, setActiveTab] = useState('all');

  // Get farmer and crop data
  const farmer = getFarmerById(farmerId);
  const crop = getCropById(cropId);

  // Get all activities for this farmer and crop
  const allActivities = useMemo(() => {
    if (!farmer || !crop) return [] as CropActivity[];
    return getFarmerCropActivities(farmerId, cropId);
  }, [farmerId, cropId, getFarmerCropActivities, crop, farmer]);

  // Filter activities based on selected tab
  const filteredActivities = useMemo(() => {
    if (activeTab === 'all') return allActivities;
    return allActivities.filter((activity) => activity.type === activeTab);
  }, [allActivities, activeTab]);

  if (!farmer || !crop) {
    return <div>Farmer or crop not found</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{farmer.name}</h1>
              <Badge variant="outline" className="font-normal">
                <Leaf className="h-3 w-3 mr-1 text-green-600" />
                {crop.name}
              </Badge>
            </div>
            <p className="text-muted-foreground">{farmer.location}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/visits/new?farmerId=${farmerId}&cropId=${cropId}`)
            }
            className="hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Visit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/purchases/new?farmerId=${farmerId}&cropId=${cropId}`
              )
            }
            className="hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Purchase
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" className="px-4">
              All
              {allActivities.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {allActivities.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="visit" className="px-4">
              Visits
              {allActivities.filter((a) => a.type === 'visit').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {allActivities.filter((a) => a.type === 'visit').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="purchase" className="px-4">
              Purchases
              {allActivities.filter((a) => a.type === 'purchase').length >
                0 && (
                <Badge variant="secondary" className="ml-2">
                  {allActivities.filter((a) => a.type === 'purchase').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="sm:hidden flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                router.push(`/visits/new?farmerId=${farmerId}&cropId=${cropId}`)
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                router.push(
                  `/purchases/new?farmerId=${farmerId}&cropId=${cropId}`
                )
              }
            >
              <IndianRupee className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          {renderActivities(filteredActivities)}
        </TabsContent>
        <TabsContent value="visit" className="mt-4">
          {renderActivities(filteredActivities)}
        </TabsContent>
        <TabsContent value="purchase" className="mt-4">
          {renderActivities(filteredActivities)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderActivities(activities: CropActivity[]) {
    if (activities.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <History className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No activities yet</h3>
            <p className="text-muted-foreground mb-4">
              There are no{' '}
              {activeTab === 'all'
                ? 'activities'
                : activeTab === 'visit'
                ? 'visits'
                : 'purchases'}{' '}
              recorded for this crop.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() =>
                  router.push(
                    `/visits/new?farmerId=${farmerId}&cropId=${cropId}`
                  )
                }
                className="bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Visit
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    `/purchases/new?farmerId=${farmerId}&cropId=${cropId}`
                  )
                }
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Purchase
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {activities.map((activity) => (
          <Card
            key={`${activity.type}-${activity.id}`}
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/${activity.type}s/${activity.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === 'visit'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {activity.type === 'visit' ? (
                      <Calendar className="h-4 w-4" />
                    ) : (
                      <IndianRupee className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {activity.type === 'visit' ? 'Visit' : 'Purchase'}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      <FormattedDate date={activity.date} />
                    </p>
                  </div>
                </div>

                {activity.type === 'visit' && (
                  <div className="flex gap-2 items-center">
                    {(activity.details as Visit).images?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {(activity.details as Visit).images.length}
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-2 py-1 rounded-full text-xs ${
                        (activity.details as Visit).cropHealth === 'good'
                          ? 'bg-green-100 text-green-800'
                          : (activity.details as Visit).cropHealth === 'average'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(activity.details as Visit).cropHealth
                        .charAt(0)
                        .toUpperCase() +
                        (activity.details as Visit).cropHealth.slice(1)}
                    </div>
                  </div>
                )}

                {activity.type === 'purchase' && (
                  <div className="flex flex-col items-end">
                    <div className="font-semibold flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {(activity.details as Purchase).totalAmount}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs ${
                        (activity.details as Purchase).remainingAmount === 0
                          ? 'bg-green-100 text-green-800'
                          : (activity.details as Purchase).amountPaid > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(activity.details as Purchase).remainingAmount === 0
                        ? 'Paid'
                        : (activity.details as Purchase).amountPaid > 0
                        ? 'Partial'
                        : 'Pending'}
                    </div>
                  </div>
                )}
              </div>

              {activity.type === 'visit' && (
                <div className="mt-3">
                  <p className="text-sm line-clamp-2">
                    {(activity.details as Visit).notes}
                  </p>
                </div>
              )}

              {activity.type === 'purchase' && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                      {(activity.details as Purchase).items}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}
