import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Shield, Server, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { incidentApi, type DashboardStats } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const severityDot: Record<string, string> = {
  CRITICAL: 'bg-destructive',
  HIGH: 'bg-amber-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-slate-500',
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await incidentApi.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { icon: Activity, label: 'Total Incidents', value: stats?.totalIncidents ?? 0, variant: 'default' as const },
    { icon: AlertTriangle, label: 'Open Incidents', value: stats?.openIncidents ?? 0, variant: 'warning' as const },
    { icon: Shield, label: 'Critical', value: stats?.criticalIncidents ?? 0, variant: 'destructive' as const },
    { icon: Server, label: 'Resolved', value: stats?.resolvedIncidents ?? 0, variant: 'success' as const },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SOC Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here is your security overview.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="gap-1">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : stats?.recentIncidents && stats.recentIncidents.length > 0 ? (
              <div className="space-y-4">
                {stats.recentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${severityDot[incident.severity] || 'bg-blue-500'}`} />
                      <span className="text-sm">{incident.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={incident.severity === 'CRITICAL' || incident.severity === 'HIGH' ? 'destructive' : incident.severity === 'MEDIUM' ? 'warning' : 'default'}>
                        {incident.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(incident.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No incidents yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Incident Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Open', value: stats?.openIncidents ?? 0, color: 'bg-destructive' },
                  { label: 'In Progress', value: stats?.inProgressIncidents ?? 0, color: 'bg-amber-500' },
                  { label: 'Resolved', value: stats?.resolvedIncidents ?? 0, color: 'bg-emerald-500' },
                  { label: 'Critical', value: stats?.criticalIncidents ?? 0, color: 'bg-red-700' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
