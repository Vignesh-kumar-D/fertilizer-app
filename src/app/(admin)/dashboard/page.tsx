'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Farmer, Visit } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { getFarmers, getVisitsByFarmerId } = useFirebase();

  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [cropHealthData, setCropHealthData] = useState<Record<string, number>>(
    {}
  );

  // Load all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all farmers
        const farmersResponse = await getFarmers();
        const allFarmers = farmersResponse.data;
        setFarmers(allFarmers);

        // Get all visits for each farmer
        const allVisits: Visit[] = [];
        const visitPromises = allFarmers.map(async (farmer) => {
          try {
            const farmerVisits = await getVisitsByFarmerId(farmer.id);
            return farmerVisits;
          } catch (error) {
            console.error(
              `Error fetching visits for farmer ${farmer.id}:`,
              error
            );
            return [];
          }
        });

        const visitsArrays = await Promise.all(visitPromises);
        visitsArrays.forEach((farmerVisits) => {
          allVisits.push(...farmerVisits);
        });

        // Calculate crop health data
        const healthData = allVisits.reduce((acc, visit) => {
          const status = visit.cropHealth;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setCropHealthData(healthData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getFarmers, getVisitsByFarmerId]);

  // Calculate metrics
  const totalDue = farmers.reduce(
    (sum, farmer) => sum + (farmer.totalDue || 0),
    0
  );
  const totalPaid = farmers.reduce(
    (sum, farmer) => sum + (farmer.totalPaid || 0),
    0
  );

  // Calculate visit statistics
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const visitStats = farmers.reduce(
    (stats, farmer) => {
      const lastVisitDate = farmer.lastVisitDate
        ? new Date(farmer.lastVisitDate)
        : new Date(0);
      if (lastVisitDate < sevenDaysAgo) {
        stats.overdue++;
      }
      if (lastVisitDate >= sevenDaysAgo) {
        stats.recent++;
      }
      return stats;
    },
    { recent: 0, overdue: 0 }
  );

  // Prepare data for pie chart
  const pieChartData = Object.entries(cropHealthData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ['#22c55e', '#eab308', '#ef4444'];

  // Get farmers with pending dues sorted by amount
  const farmersWithDues = [...farmers]
    .filter((farmer) => (farmer.totalDue || 0) > 0)
    .sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0));

  // Get farmers requiring attention (overdue visits AND pending dues)
  const farmersRequiringAttention = farmers
    .filter((farmer) => {
      const lastVisitDate = farmer.lastVisitDate
        ? new Date(farmer.lastVisitDate)
        : new Date(0);
      return lastVisitDate < sevenDaysAgo && (farmer.totalDue || 0) > 0;
    })
    .sort((a, b) => {
      // Sort by a combination of overdue time and amount due
      const aLastVisit = a.lastVisitDate
        ? new Date(a.lastVisitDate)
        : new Date(0);
      const bLastVisit = b.lastVisitDate
        ? new Date(b.lastVisitDate)
        : new Date(0);

      // First prioritize by days since last visit
      const aDaysSinceVisit = Math.floor(
        (today.getTime() - aLastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );
      const bDaysSinceVisit = Math.floor(
        (today.getTime() - bLastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (aDaysSinceVisit !== bDaysSinceVisit) {
        return bDaysSinceVisit - aDaysSinceVisit; // Descending by days
      }

      // If days are equal, then sort by due amount
      return (b.totalDue || 0) - (a.totalDue || 0);
    });

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="bg-white hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => router.push('/dashboard/pending-dues')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Due Amount
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalDue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {farmersWithDues.length} farmers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Paid Amount
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total collections till date
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Visits</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {visitStats.recent}
            </div>
            <p className="text-xs text-muted-foreground">
              Visits in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Visits
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {visitStats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">
              Not visited in 7+ days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Only Crop Health Overview */}
      <div className="grid grid-cols-1 gap-6">
        {/* Crop Health Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Crop Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {Object.keys(cropHealthData).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No crop health data available
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farmers Requiring Attention */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Farmers Requiring Attention</h2>
        <div className="grid gap-4">
          {farmersRequiringAttention.length > 0 ? (
            farmersRequiringAttention.slice(0, 5).map((farmer) => {
              const lastVisitDate = farmer.lastVisitDate
                ? new Date(farmer.lastVisitDate)
                : new Date(0);
              const daysSinceVisit = Math.floor(
                (today.getTime() - lastVisitDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <Card
                  key={farmer.id}
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/farmers/${farmer.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{farmer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {farmer.location}
                        </div>
                        <div className="text-sm mt-1">
                          Last Visit: {daysSinceVisit} days ago
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Due Amount
                        </div>
                        <div className="font-medium text-red-600">
                          ₹{(farmer.totalDue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground">
              No farmers requiring attention
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
