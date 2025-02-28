'use client';

import { useMockData } from '@/lib/mock-data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { farmers, visits } = useMockData();

  // Calculate total dues and payments
  const totalDue = farmers.reduce((sum, farmer) => sum + farmer.totalDue, 0);
  const totalPaid = farmers.reduce((sum, farmer) => sum + farmer.totalPaid, 0);

  // Calculate visit statistics
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const visitStats = farmers.reduce(
    (stats, farmer) => {
      const lastVisitDate = new Date(farmer.lastVisitDate);
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

  // Prepare data for charts
  const cropHealthData = visits.reduce((acc, visit) => {
    const status = visit.cropHealth;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(cropHealthData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ['#22c55e', '#eab308', '#ef4444'];

  // Group visits by date for line chart
  const visitsByDate = visits.reduce((acc, visit) => {
    const date = new Date(visit.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visitTrendData = Object.entries(visitsByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({
      date,
      visits: count,
    }));

  // Calculate payment statistics for bar chart
  const paymentStats = farmers
    .map((farmer) => ({
      name: farmer.name.split(' ')[0],
      paid: farmer.totalPaid,
      due: farmer.totalDue,
    }))
    .sort((a, b) => b.paid + b.due - (a.paid + a.due))
    .slice(0, 5);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
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
              From {farmers.length} farmers
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visit Trends */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Visit Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="hsl(142.1 76.2% 36.3%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Crop Health Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Crop Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
            </div>
          </CardContent>
        </Card>

        {/* Top Farmers by Payment */}
        <Card className="bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Top Farmers by Transaction Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="paid" fill="#22c55e" name="Paid Amount" />
                  <Bar dataKey="due" fill="#ef4444" name="Due Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farmers Requiring Attention */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Farmers Requiring Attention</h2>
        <div className="grid gap-4">
          {farmers
            .filter((farmer) => {
              const lastVisitDate = new Date(farmer.lastVisitDate);
              return lastVisitDate < sevenDaysAgo;
            })
            .map((farmer) => (
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
                        Last Visit:{' '}
                        {new Date(farmer.lastVisitDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Due Amount
                      </div>
                      <div className="font-medium text-red-600">
                        ₹{farmer.totalDue}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
