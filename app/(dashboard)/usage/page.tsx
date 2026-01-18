'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  UsageAreaChart,
  RequestsBarChart,
  ModelPieChart,
  TokensChart,
} from '@/components/usage-chart';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface UsageStats {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  dailyData: Array<{
    date: string;
    cost: number;
    requests: number;
    tokens: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    cost: number;
    requests: number;
    percentage: number;
  }>;
  recentRequests: Array<{
    id: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    success: boolean;
    createdAt: string;
  }>;
}

const timeRanges = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
];

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      setLoading(true);
      try {
        const range = timeRanges.find(r => r.value === timeRange);
        const startDate = startOfDay(subDays(new Date(), range?.days || 7));
        const endDate = endOfDay(new Date());

        const res = await fetch(
          `/api/usage?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );

        if (!res.ok) throw new Error('Failed to fetch usage data');

        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage data');
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Usage</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[380px] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Usage</h1>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totalCost = 0, totalRequests = 0, totalTokens = 0, dailyData = [], modelBreakdown = [], recentRequests = [] } = stats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage</h1>
          <p className="text-muted-foreground">
            Track your API usage and costs
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cost</CardDescription>
            <CardTitle className="text-3xl">${totalCost.toFixed(4)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              For the selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>API Requests</CardDescription>
            <CardTitle className="text-3xl">{totalRequests.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total requests made
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens</CardDescription>
            <CardTitle className="text-3xl">
              {totalTokens >= 1000000
                ? `${(totalTokens / 1000000).toFixed(2)}M`
                : totalTokens >= 1000
                ? `${(totalTokens / 1000).toFixed(1)}K`
                : totalTokens.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Input + output tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UsageAreaChart data={dailyData} />
        <RequestsBarChart data={dailyData} />
        <ModelPieChart data={modelBreakdown} />
        <TokensChart data={dailyData} />
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your latest API calls</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No requests yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.model}</TableCell>
                    <TableCell>{req.inputTokens.toLocaleString()}</TableCell>
                    <TableCell>{req.outputTokens.toLocaleString()}</TableCell>
                    <TableCell>${req.cost.toFixed(6)}</TableCell>
                    <TableCell>
                      <Badge variant={req.success ? 'default' : 'destructive'}>
                        {req.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(req.createdAt), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
