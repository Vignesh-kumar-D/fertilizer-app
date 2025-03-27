'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-context';
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
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import FormattedDate from '@/lib/FormattedDate';
import { Visit, Purchase, Farmer, Crop, CropActivity } from '@/types';
import { ImageCarousel } from '../shared/Imagecarousel';

interface FarmerCropActivitiesProps {
  farmerId: string;
  cropId: string;
}

export default function FarmerCropActivities({
  farmerId,
  cropId,
}: FarmerCropActivitiesProps) {
  const router = useRouter();
  const { getFarmerById, getCropActivity, getCropById } = useFirebase();

  const [activeTab, setActiveTab] = useState('all');
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [activities, setActivities] = useState<CropActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch farmer, crop, and activities data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch farmer and crop in parallel
        const [farmerData, cropData] = await Promise.all([
          getFarmerById(farmerId),
          getCropById(cropId),
        ]);

        if (!farmerData) {
          setError('Farmer not found');
          setLoading(false);
          return;
        }

        if (!cropData) {
          setError('Crop not found');
          setLoading(false);
          return;
        }

        setFarmer(farmerData);
        setCrop(cropData);

        // Fetch all activities for this farmer and crop
        const cropActivities = await getCropActivity(farmerId, cropId);
        setActivities(cropActivities);
      } catch (err) {
        console.error('Error fetching crop activities:', err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [farmerId, cropId, getFarmerById, getCropById, getCropActivity]);

  // Filter activities based on selected tab
  const filteredActivities = activities.filter((activity) => {
    if (activeTab === 'all') return true;
    return activity.type === activeTab;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading activities...</p>
      </div>
    );
  }

  // Show error state
  if (error || !farmer || !crop) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <History className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Farmer or crop not found'}
            </p>
            <Button
              onClick={() => router.push('/farmers')}
              className="bg-primary text-primary-foreground"
            >
              Return to Farmers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
              {activities.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activities.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="visit" className="px-4">
              Visits
              {activities.filter((a) => a.type === 'visit').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activities.filter((a) => a.type === 'visit').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="purchase" className="px-4 md:mx-2">
              Purchases
              {activities.filter((a) => a.type === 'purchase').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activities.filter((a) => a.type === 'purchase').length}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <Card
            key={`${activity.type}-${activity.id}`}
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/${activity.type}s/${activity.id}`)}
          >
            <CardContent className="p-4">
              {/* If visit has images, show image carousel at the top with more compact size */}
              {activity.type === 'visit' &&
                (activity.details as Visit).images &&
                (activity.details as Visit).images.length > 0 && (
                  <div className="mb-4 ">
                    <ImageCarousel
                      aspectRatio="wide"
                      images={(activity.details as Visit).images}
                    />
                  </div>
                )}

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
