import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Shield,
  Server,
  AlertTriangle,
  RefreshCw,
  Eye,
  Download,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  reportsApi,
  type IncidentsReport,
  type AssetsReport,
  type SummaryReport,
  type ReportFilters,
  type Incident,
  type Asset,
} from '@/lib/api';
import { formatDate } from '@/lib/utils';

type ReportTab = 'incidents' | 'assets' | 'critical-incidents' | 'executive-summary';

interface Filters {
  startDate: string;
  endDate: string;
  severity: string;
  status: string;
  assetType: string;
}

const severityBadge: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

const statusBadge: Record<string, 'destructive' | 'warning' | 'success' | 'default'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const reportCards = [
  {
    key: 'incidents' as ReportTab,
    icon: AlertTriangle,
    title: 'Incident Reports',
    description: 'Detailed incident logs with severity and status breakdown.',
    color: 'text-red-500',
  },
  {
    key: 'assets' as ReportTab,
    icon: Server,
    title: 'Asset Reports',
    description: 'Complete asset inventory with type and criticality analysis.',
    color: 'text-blue-500',
  },
  {
    key: 'critical-incidents' as ReportTab,
    icon: Shield,
    title: 'Critical Incident Reports',
    description: 'Focus on high-severity incidents requiring immediate attention.',
    color: 'text-amber-500',
  },
  {
    key: 'executive-summary' as ReportTab,
    icon: FileText,
    title: 'Executive Summary',
    description: 'High-level overview of security posture and key metrics.',
    color: 'text-emerald-500',
  },
];

const severityOptions = [
  { value: '', label: 'All Severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const assetTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'SERVER', label: 'Server' },
  { value: 'WORKSTATION', label: 'Workstation' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'FIREWALL', label: 'Firewall' },
  { value: 'SWITCH', label: 'Switch' },
  { value: 'ROUTER', label: 'Router' },
  { value: 'CLOUD_VM', label: 'Cloud VM' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'OTHER', label: 'Other' },
];

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function buildFilterParams(filters: Filters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.severity) params.severity = filters.severity;
  if (filters.status) params.status = filters.status;
  if (filters.assetType) params.assetType = filters.assetType;
  return params;
}

export function Reports() {
  useDocumentTitle('Reports');
  const [activeTab, setActiveTab] = useState<ReportTab>('incidents');
  const [filters, setFilters] = useState<Filters>({
    startDate: '', endDate: '', severity: '', status: '', assetType: '',
  });

  const [incidentsReport, setIncidentsReport] = useState<IncidentsReport | null>(null);
  const [assetsReport, setAssetsReport] = useState<AssetsReport | null>(null);
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewItem, setPreviewItem] = useState<Incident | Asset | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = buildFilterParams(filters);
      switch (activeTab) {
        case 'incidents': {
          const res = await reportsApi.getIncidents(params);
          setIncidentsReport(res.data);
          break;
        }
        case 'assets': {
          const res = await reportsApi.getAssets(params);
          setAssetsReport(res.data);
          break;
        }
        case 'critical-incidents': {
          const res = await reportsApi.getIncidents({ ...params, severity: 'CRITICAL' });
          setIncidentsReport(res.data);
          break;
        }
        case 'executive-summary': {
          const res = await reportsApi.getSummary(params);
          setSummaryReport(res.data);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data.');
    } finally { setLoading(false); }
  }, [activeTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function generateCsvContent(): string {
    if (activeTab === 'incidents' || activeTab === 'critical-incidents') {
      if (!incidentsReport) return '';
      const headers = ['Title', 'Description', 'Severity', 'Status', 'Assigned To', 'Created'];
      const rows = incidentsReport.data.map((inc) => [
        inc.title,
        inc.description.replace(/"/g, '""'),
        inc.severity,
        inc.status,
        inc.assignedUser ? `${inc.assignedUser.firstName} ${inc.assignedUser.lastName}` : '',
        inc.createdAt,
      ]);
      return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    }
    if (activeTab === 'assets') {
      if (!assetsReport) return '';
      const headers = ['Asset Name', 'Type', 'Criticality', 'Status', 'IP Address', 'Location', 'Owner'];
      const rows = assetsReport.data.map((a) => [
        a.assetName,
        a.assetType,
        a.criticality,
        a.status,
        a.ipAddress || '',
        a.location || '',
        a.owner || '',
      ]);
      return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    }
    if (activeTab === 'executive-summary') {
      if (!summaryReport) return '';
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Incidents', String(summaryReport.totalIncidents)],
        ['Open Incidents', String(summaryReport.openIncidents)],
        ['Critical Incidents', String(summaryReport.criticalIncidents)],
        ['Total Assets', String(summaryReport.totalAssets)],
        ['Active Assets', String(summaryReport.activeAssets)],
        ['Critical Assets', String(summaryReport.criticalAssets)],
      ];
      return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    }
    return '';
  }

  const handleExport = async (exportFormat: 'pdf' | 'csv') => {
    try {
      if (exportFormat === 'csv') {
        const content = generateCsvContent();
        if (!content) {
          setError('No data available to export.');
          return;
        }
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const exportFilters: ReportFilters = {};
      if (filters.startDate) exportFilters.startDate = filters.startDate;
      if (filters.endDate) exportFilters.endDate = filters.endDate;
      if (filters.severity) exportFilters.severity = filters.severity;
      if (filters.status) exportFilters.status = filters.status;
      if (filters.assetType) exportFilters.assetType = filters.assetType;
      const blob = await reportsApi.downloadExport({
        type: activeTab, format: 'pdf',
        filters: Object.keys(exportFilters).length > 0 ? exportFilters : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report.');
    }
  };

  const renderFilters = () => (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} className="w-36" aria-label="Start date" />
        <span className="text-muted-foreground text-sm">to</span>
        <Input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} className="w-36" aria-label="End date" />
      </div>
      {(activeTab === 'incidents' || activeTab === 'critical-incidents') && (
        <>
          <Select options={severityOptions} value={filters.severity} onValueChange={(v) => setFilters((f) => ({ ...f, severity: v }))} placeholder="All Severities" />
          <Select options={statusOptions} value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))} placeholder="All Statuses" />
        </>
      )}
      {activeTab === 'assets' && (
        <Select options={assetTypeOptions} value={filters.assetType} onValueChange={(v) => setFilters((f) => ({ ...f, assetType: v }))} placeholder="All Types" />
      )}
      {(filters.startDate || filters.endDate || filters.severity || filters.status || filters.assetType) && (
        <Button variant="ghost" size="sm" onClick={() => setFilters({ startDate: '', endDate: '', severity: '', status: '', assetType: '' })}>
          Clear
        </Button>
      )}
    </div>
  );

  const renderIncidentTable = (data: IncidentsReport['data']) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Title</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Severity</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Status</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Assigned To</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Created</th>
            <th className="text-right font-medium text-muted-foreground pb-3" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((incident) => (
            <tr key={incident.id} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
              <td className="py-3 pr-4 font-medium max-w-[200px] truncate">{incident.title}</td>
              <td className="py-3 pr-4"><Badge variant={severityBadge[incident.severity] || 'default'}>{incident.severity}</Badge></td>
              <td className="py-3 pr-4"><Badge variant={statusBadge[incident.status] || 'default'}>{incident.status === 'IN_PROGRESS' ? 'In Progress' : incident.status.charAt(0) + incident.status.slice(1).toLowerCase()}</Badge></td>
              <td className="py-3 pr-4 text-muted-foreground">{incident.assignedUser ? `${incident.assignedUser.firstName} ${incident.assignedUser.lastName}` : '-'}</td>
              <td className="py-3 pr-4 text-muted-foreground text-xs whitespace-nowrap">{formatDate(incident.createdAt)}</td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setPreviewItem(incident); setShowPreview(true); }} className="h-8 px-2">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('pdf')} className="h-8 px-2">
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('csv')} className="h-8 px-2">
                    <Download className="h-3.5 w-3.5 mr-1" /> CSV
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAssetTable = (data: AssetsReport['data']) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Asset Name</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Type</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Criticality</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">Status</th>
            <th className="text-left font-medium text-muted-foreground pb-3 pr-4" scope="col">IP Address</th>
            <th className="text-right font-medium text-muted-foreground pb-3" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((asset) => (
            <tr key={asset.id} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
              <td className="py-3 pr-4 font-medium">{asset.assetName}</td>
              <td className="py-3 pr-4 text-muted-foreground">{asset.assetType.replace(/_/g, ' ')}</td>
              <td className="py-3 pr-4"><Badge variant={severityBadge[asset.criticality] || 'default'}>{asset.criticality}</Badge></td>
              <td className="py-3 pr-4"><Badge variant={asset.status === 'ACTIVE' ? 'success' : asset.status === 'MAINTENANCE' ? 'warning' : 'default'}>{asset.status}</Badge></td>
              <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{asset.ipAddress || '-'}</td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setPreviewItem(asset); setShowPreview(true); }} className="h-8 px-2">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('pdf')} className="h-8 px-2">
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('csv')} className="h-8 px-2">
                    <Download className="h-3.5 w-3.5 mr-1" /> CSV
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSummary = (data: SummaryReport) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
      {[
        { label: 'Total Incidents', value: data.totalIncidents, color: '' },
        { label: 'Open Incidents', value: data.openIncidents, color: 'text-amber-500' },
        { label: 'Critical Incidents', value: data.criticalIncidents, color: 'text-red-500' },
        { label: 'Total Assets', value: data.totalAssets, color: '' },
        { label: 'Active Assets', value: data.activeAssets, color: 'text-emerald-500' },
        { label: 'Critical Assets', value: data.criticalAssets, color: 'text-red-500' },
      ].map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div className="rounded-md bg-destructive/10 p-4 flex items-center gap-3" role="alert">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">Retry</Button>
        </div>
      );
    }

    if (loading) return <ReportSkeleton />;

    switch (activeTab) {
      case 'incidents':
      case 'critical-incidents':
        if (!incidentsReport || incidentsReport.data.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No incidents found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or date range.</p>
            </div>
          );
        }
        return renderIncidentTable(incidentsReport.data);

      case 'assets':
        if (!assetsReport || assetsReport.data.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No assets found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or date range.</p>
            </div>
          );
        }
        return renderAssetTable(assetsReport.data);

      case 'executive-summary':
        if (!summaryReport) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No summary data available</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or date range.</p>
            </div>
          );
        }
        return (
          <>
            {renderSummary(summaryReport)}
            {summaryReport.recentIncidents.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Incidents</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summaryReport.recentIncidents.map((incident) => (
                      <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{incident.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{incident.createdBy.firstName} {incident.createdBy.lastName} · {formatDate(incident.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Badge variant={severityBadge[incident.severity] || 'default'}>{incident.severity}</Badge>
                          <Badge variant={statusBadge[incident.status] || 'default'}>{incident.status === 'IN_PROGRESS' ? 'In Progress' : incident.status.charAt(0) + incident.status.slice(1).toLowerCase()}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <p className="text-xs text-muted-foreground mt-4">Report generated: {formatDate(summaryReport.reportGeneratedAt)}</p>
          </>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and manage security reports.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === card.key ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => { setActiveTab(card.key); setPreviewItem(null); }}
              role="button"
              tabIndex={0}
              aria-pressed={activeTab === card.key}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveTab(card.key); setPreviewItem(null); } }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-lg">{reportCards.find((c) => c.key === activeTab)?.title || 'Report'}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={loading} className="gap-1">
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={loading} className="gap-1">
                <Download className="h-4 w-4" /> Download CSV
              </Button>
            </div>
          </div>
          <div className="mt-4">{renderFilters()}</div>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      {showPreview && previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPreview(false)}>
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Item Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {'title' in previewItem ? (
                  <>
                    <div><p className="text-xs text-muted-foreground">Title</p><p className="text-sm font-medium">{(previewItem as Incident).title}</p></div>
                    <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{(previewItem as Incident).description}</p></div>
                    <div className="flex gap-4">
                      <div><p className="text-xs text-muted-foreground">Severity</p><Badge variant={severityBadge[(previewItem as Incident).severity] || 'default'}>{(previewItem as Incident).severity}</Badge></div>
                      <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={statusBadge[(previewItem as Incident).status] || 'default'}>{(previewItem as Incident).status === 'IN_PROGRESS' ? 'In Progress' : (previewItem as Incident).status.charAt(0) + (previewItem as Incident).status.slice(1).toLowerCase()}</Badge></div>
                    </div>
                    <div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm">{formatDate((previewItem as Incident).createdAt)}</p></div>
                  </>
                ) : (
                  <>
                    <div><p className="text-xs text-muted-foreground">Asset Name</p><p className="text-sm font-medium">{(previewItem as Asset).assetName}</p></div>
                    <div><p className="text-xs text-muted-foreground">Type</p><p className="text-sm">{(previewItem as Asset).assetType.replace(/_/g, ' ')}</p></div>
                    <div className="flex gap-4">
                      <div><p className="text-xs text-muted-foreground">Criticality</p><Badge variant={severityBadge[(previewItem as Asset).criticality] || 'default'}>{(previewItem as Asset).criticality}</Badge></div>
                      <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={(previewItem as Asset).status === 'ACTIVE' ? 'success' : (previewItem as Asset).status === 'MAINTENANCE' ? 'warning' : 'default'}>{(previewItem as Asset).status}</Badge></div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}