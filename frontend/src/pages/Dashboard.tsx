import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Shield, Server, RefreshCw, Monitor, Wrench, Bell, ScrollText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { incidentApi, assetApi, notificationApi, auditApi, type DashboardStats, type AssetDashboardStats, type AuditLog, type Notification as ApiNotification } from '@/lib/api';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { useAutoRefresh } from '@/lib/utils';

const severityDot: Record<string, string> = {
  CRITICAL: 'bg-destructive',
  HIGH: 'bg-amber-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-slate-500',
};

const severityColors: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

const auditSeverityColors: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  Low: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  Info: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

interface SystemHealth {
  database: string;
  api: string;
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, loading }: {
  icon: typeof Activity;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
});

const WidgetCard = memo(function WidgetCard({ title, children, className }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
});

export function Dashboard() {
  useDocumentTitle('Dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assetStats, setAssetStats] = useState<AssetDashboardStats | null>(null);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({ database: 'checking', api: 'checking' });

  const fetchAllData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [incidentRes, assetRes] = await Promise.all([
        incidentApi.getDashboardStats(),
        assetApi.getDashboardStats(),
      ]);
      setStats(incidentRes.data);
      setAssetStats(assetRes.data);

      const notifRes = await notificationApi.list().catch(() => null);
      setNotifications(notifRes?.data?.slice(0, 5) || []);

      const auditRes = await auditApi.list({ limit: '5' }).catch(() => null);
      setAuditLogs(auditRes?.data || []);

      setSystemHealth({ database: 'healthy', api: 'healthy' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      setSystemHealth({ database: 'unknown', api: 'unknown' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useAutoRefresh(fetchAllData, 30000);

  const statCards = [
    { icon: Activity, label: 'Total Incidents', value: stats?.totalIncidents ?? 0 },
    { icon: AlertTriangle, label: 'Open Incidents', value: stats?.openIncidents ?? 0 },
    { icon: Shield, label: 'Critical', value: stats?.criticalIncidents ?? 0 },
    { icon: Server, label: 'Resolved', value: stats?.resolvedIncidents ?? 0 },
  ];

  const assetStatCards = [
    { icon: Server, label: 'Total Assets', value: assetStats?.totalAssets ?? 0 },
    { icon: Monitor, label: 'Active', value: assetStats?.activeAssets ?? 0 },
    { icon: AlertTriangle, label: 'Critical Assets', value: assetStats?.criticalAssets ?? 0 },
    { icon: Wrench, label: 'Maintenance', value: assetStats?.maintenanceAssets ?? 0 },
  ];

  const criticalAssets = (assetStats?.recentAssets || [])
    .filter((a) => a.criticality === 'CRITICAL' || a.criticality === 'HIGH')
    .slice(0, 5);

  const openIncidents = (stats?.recentIncidents || [])
    .filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SOC Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time security operations overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-2">
            <span className="flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-full ${systemHealth.database === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              DB
            </span>
            <span className="flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-full ${systemHealth.api === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              API
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading} className="gap-1">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
            <StatCard {...stat} loading={loading} />
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Asset Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {assetStatCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
            >
              <StatCard {...stat} loading={loading} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <WidgetCard title="Recent Incidents" className="lg:col-span-4">
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
            <div className="space-y-2">
              {stats.recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${severityDot[incident.severity] || 'bg-blue-500'}`} />
                    <span className="text-sm truncate">{incident.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant={severityColors[incident.severity] || 'default'}>
                      {incident.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{formatDate(incident.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No incidents yet.</p>
          )}
        </WidgetCard>

        <WidgetCard title="Incident Overview" className="lg:col-span-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
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
        </WidgetCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <WidgetCard title="Recent Notifications" className="lg:col-span-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-lg border border-border/40 p-3"
                >
                  <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0">New</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No notifications.</p>
          )}
        </WidgetCard>

        <WidgetCard title="Open Incidents" className="lg:col-span-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : openIncidents.length > 0 ? (
            <div className="space-y-2">
              {openIncidents.slice(0, 5).map((inc) => (
                <div key={inc.id} className="flex items-center justify-between rounded-lg border border-border/40 p-2.5">
                  <span className="text-sm truncate flex-1 min-w-0">{inc.title}</span>
                  <Badge variant={severityColors[inc.severity] || 'default'} className="shrink-0 ml-2">
                    {inc.severity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">All incidents resolved.</p>
          )}
        </WidgetCard>

        <WidgetCard title="Top Critical Assets" className="lg:col-span-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : criticalAssets.length > 0 ? (
            <div className="space-y-2">
              {criticalAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between rounded-lg border border-border/40 p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{asset.assetName}</span>
                  </div>
                  <Badge variant={severityColors[asset.criticality] || 'default'} className="shrink-0 ml-2">
                    {asset.criticality}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No critical assets.</p>
          )}
        </WidgetCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <WidgetCard title="Recent Audit Logs">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : auditLogs.length > 0 ? (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
                  <ScrollText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{log.action} on {log.resource}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.userName} · {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                  <span className={auditSeverityColors[log.severity] || 'text-muted-foreground' + ' inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold shrink-0'}>
                    {log.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No audit logs yet.</p>
          )}
        </WidgetCard>

        <WidgetCard title="System Health">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${systemHealth.database === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm">Database</span>
              </div>
              <span className={`text-xs font-medium ${systemHealth.database === 'healthy' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {systemHealth.database === 'healthy' ? 'Connected' : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${systemHealth.api === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm">API</span>
              </div>
              <span className={`text-xs font-medium ${systemHealth.api === 'healthy' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {systemHealth.api === 'healthy' ? 'Operational' : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm">Last Updated</span>
              </div>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(new Date().toISOString())}</span>
            </div>
          </div>
        </WidgetCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assets</CardTitle>
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
          ) : assetStats?.recentAssets && assetStats.recentAssets.length > 0 ? (
            <div className="space-y-3">
              {assetStats.recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate">{asset.assetName}</span>
                      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                        {asset.assetType} {asset.ipAddress ? `· ${asset.ipAddress}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant={severityColors[asset.criticality] || 'default'}>
                      {asset.criticality}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{formatDate(asset.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No assets yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}