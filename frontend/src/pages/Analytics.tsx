import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Shield,
  Server,
  RefreshCw,
  TrendingUp,
  PieChart,
  BarChart3,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartSkeleton, chartColors } from '@/components/ui/chart';
import { analyticsApi, type AnalyticsOverview, type AnalyticsIncidents, type AnalyticsAssets, type AnalyticsTrends } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const severityBadge: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

const statusDot: Record<string, string> = {
  OPEN: 'bg-destructive',
  IN_PROGRESS: 'bg-amber-500',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-slate-500',
};

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [incidents, setIncidents] = useState<AnalyticsIncidents | null>(null);
  const [assets, setAssets] = useState<AnalyticsAssets | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, incidentsRes, assetsRes, trendsRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getIncidents(),
        analyticsApi.getAssets(),
        analyticsApi.getTrends(),
      ]);
      setOverview(overviewRes.data);
      setIncidents(incidentsRes.data);
      setAssets(assetsRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpiCards = [
    { icon: Activity, label: 'Total Incidents', value: overview?.totalIncidents ?? 0, color: 'text-blue-500' },
    { icon: AlertTriangle, label: 'Open Incidents', value: overview?.openIncidents ?? 0, color: 'text-amber-500' },
    { icon: Shield, label: 'Critical Incidents', value: overview?.criticalIncidents ?? 0, color: 'text-red-500' },
    { icon: Server, label: 'Total Assets', value: overview?.totalAssets ?? 0, color: 'text-emerald-500' },
  ];

  const severityData = incidents
    ? [
        { name: 'Critical', value: incidents.severityDistribution.critical, color: chartColors.red },
        { name: 'High', value: incidents.severityDistribution.high, color: chartColors.orange },
        { name: 'Medium', value: incidents.severityDistribution.medium, color: chartColors.amber },
        { name: 'Low', value: incidents.severityDistribution.low, color: chartColors.slate },
      ].filter((d) => d.value > 0)
    : [];

  const statusData = incidents
    ? [
        { name: 'Open', value: incidents.statusDistribution.open, color: chartColors.red },
        { name: 'In Progress', value: incidents.statusDistribution.inProgress, color: chartColors.orange },
        { name: 'Resolved', value: incidents.statusDistribution.resolved, color: chartColors.green },
        { name: 'Closed', value: incidents.statusDistribution.closed, color: chartColors.slate },
      ].filter((d) => d.value > 0)
    : [];

  const assetsByTypeData = assets
    ? Object.entries(assets.assetsByType)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
          value,
        }))
    : [];

  const assetTypeColors = [
    chartColors.blue, chartColors.green, chartColors.orange, chartColors.purple,
    chartColors.pink, chartColors.cyan, chartColors.red, chartColors.amber, chartColors.slate,
  ];

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(mo, 10) - 1]} ${y}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string; stroke?: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.stroke || chartColors.blue }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep security analytics and insights.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 flex items-center gap-3" role="alert">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">Retry</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}>
                <KpiSkeleton />
              </motion.div>
            ))
          : kpiCards.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Incident Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height={300} />
            ) : trends && trends.trend.length > 0 ? (
              <ChartContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.trend.map((d) => ({ ...d, month: formatMonth(d.month) }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="total" name="Total" stroke={chartColors.blue} strokeWidth={2} dot={{ r: 3 }} animationBegin={0} animationDuration={1000} />
                    <Line type="monotone" dataKey="critical" name="Critical" stroke={chartColors.red} strokeWidth={2} dot={{ r: 3 }} animationBegin={200} animationDuration={1000} />
                    <Line type="monotone" dataKey="high" name="High" stroke={chartColors.orange} strokeWidth={2} dot={{ r: 3 }} animationBegin={400} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No trend data available.</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height={300} />
            ) : severityData.length > 0 ? (
              <ChartContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={severityData}
                      cx="50%" cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No severity data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height={300} />
            ) : statusData.length > 0 ? (
              <ChartContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No status data available.</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Assets by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height={300} />
            ) : assetsByTypeData.length > 0 ? (
              <ChartContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={assetsByTypeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} animationBegin={0} animationDuration={800}>
                      {assetsByTypeData.map((_, index) => (
                        <Cell key={index} fill={assetTypeColors[index % assetTypeColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No asset type data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              Top Affected Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : assets && assets.topAffectedAssets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left font-medium text-muted-foreground pb-3" scope="col">Asset</th>
                      <th className="text-left font-medium text-muted-foreground pb-3" scope="col">Type</th>
                      <th className="text-left font-medium text-muted-foreground pb-3" scope="col">IP Address</th>
                      <th className="text-left font-medium text-muted-foreground pb-3" scope="col">Criticality</th>
                      <th className="text-right font-medium text-muted-foreground pb-3" scope="col">Incidents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.topAffectedAssets.map((asset) => (
                      <tr key={asset.id} className="border-b border-border/20">
                        <td className="py-3 pr-4 font-medium">{asset.assetName}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{asset.assetType.replace(/_/g, ' ')}</td>
                        <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{asset.ipAddress || '-'}</td>
                        <td className="py-3 pr-4"><Badge variant={severityBadge[asset.criticality] || 'default'}>{asset.criticality}</Badge></td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{asset.incidentCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No asset incident data available.</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={6} />
            ) : trends && trends.recentActivity.length > 0 ? (
              <div className="space-y-1">
                {trends.recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex gap-3 py-2.5 border-b border-border/20 last:border-0"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${statusDot[activity.status] || 'bg-blue-500'} mt-1.5`} />
                      {index < trends.recentActivity.length - 1 && <div className="w-px flex-1 bg-border/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={severityBadge[activity.severity] || 'default'} className="text-[10px] px-1.5 py-0">{activity.severity}</Badge>
                        <span className="text-xs text-muted-foreground">{activity.createdBy.firstName} {activity.createdBy.lastName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(activity.createdAt)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}