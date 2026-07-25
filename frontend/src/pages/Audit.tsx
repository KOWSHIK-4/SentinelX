import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Download, Trash2, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton, TableEmptyState } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { auditApi, type AuditLog } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  Low: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  Info: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

const ACTION_OPTIONS = [
  'Login', 'Logout', 'Failed Login',
  'Create Incident', 'Update Incident', 'Delete Incident',
  'Create Asset', 'Update Asset', 'Delete Asset',
  'Create User', 'Update User', 'Delete User',
  'Settings Updated', 'Reports Generated', 'Notifications Cleared',
];

const SEVERITY_OPTIONS = ['Info', 'Low', 'Medium', 'High', 'Critical'];

const severitySelectOptions = [
  { value: '', label: 'All Severities' },
  ...SEVERITY_OPTIONS.map((s) => ({ value: s, label: s })),
];

const actionSelectOptions = [
  { value: '', label: 'All Actions' },
  ...ACTION_OPTIONS.map((a) => ({ value: a, label: a })),
];

const limitOptions = [10, 25, 50, 100];

export function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (actionFilter) params.action = actionFilter;
      if (userFilter) params.userId = userFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const result = await auditApi.list(params);
      setLogs(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally { setLoading(false); }
  }, [page, limit, search, severityFilter, actionFilter, userFilter, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, severityFilter, actionFilter, userFilter, startDate, endDate, limit]);

  function getStats() {
    const todayStr = new Date().toISOString().slice(0, 10);
    return {
      total,
      critical: logs.filter((l) => l.severity === 'Critical').length,
      failedLogins: logs.filter((l) => l.action === 'Failed Login').length,
      today: logs.filter((l) => l.createdAt.slice(0, 10) === todayStr).length,
    };
  }

  async function handleDelete(id: string) {
    try { await auditApi.delete(id); showNotification('Audit log deleted successfully'); fetchLogs(); }
    catch { showNotification('Failed to delete log', 'error'); }
  }

  async function handleClear() {
    try { await auditApi.clear(); showNotification('All audit logs cleared successfully'); fetchLogs(); }
    catch { showNotification('Failed to clear logs', 'error'); }
  }

  function handleExportCSV() {
    const headers = ['Time', 'User', 'Action', 'Resource', 'Resource ID', 'Severity', 'IP Address', 'User Agent', 'Description'];
    const csvRows = logs.map((l) => [
      formatDate(l.createdAt), l.userName, l.action, l.resource,
      l.resourceId || '', l.severity, l.ipAddress || '',
      l.userAgent || '', l.description || '',
    ]);
    const csvContent = [headers.join(','),
      ...csvRows.map((r) => r.map((c) => {
        const s = String(c).replace(/"/g, '""');
        return '"' + s + '"';
      }).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV file downloaded successfully');
  }

  function clearFilters() {
    setSearch(''); setSeverityFilter(''); setActionFilter('');
    setUserFilter(''); setStartDate(''); setEndDate(''); setPage(1);
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track and monitor all system activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={logs.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear} disabled={logs.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear Logs
          </Button>
        </div>
      </div>

      {notification && (
        <div
          className={cn(
            'flex items-center justify-between rounded-md px-4 py-3 text-sm',
            notification.type === 'error'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          )}
          role="status"
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Logs', value: stats.total, color: '' },
          { label: 'Critical Events', value: stats.critical, color: 'text-destructive' },
          { label: 'Failed Logins', value: stats.failedLogins, color: 'text-orange-500' },
          { label: "Today's Events", value: stats.today, color: '' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stat.color}`}>{loading ? '-' : stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                aria-label="Search audit logs"
              />
            </div>
            <Select options={severitySelectOptions} value={severityFilter} onValueChange={setSeverityFilter} className="w-[140px]" placeholder="Severity" />
            <Select options={actionSelectOptions} value={actionFilter} onValueChange={setActionFilter} className="w-[160px]" placeholder="Action" />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[140px]" aria-label="Start date" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[140px]" aria-label="End date" />
            <Input placeholder="User ID" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-[140px]" aria-label="Filter by user ID" />
            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear Filters</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <TableEmptyState
              icon={Search}
              title="No audit logs found"
              description="Try adjusting your filters or check back later."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">{formatDate(log.createdAt)}</TableCell>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.resource}
                          {log.resourceId ? <span className="ml-1 font-mono">#{log.resourceId.slice(0, 8)}</span> : null}
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', SEVERITY_COLORS[log.severity])}>
                            {log.severity}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.ipAddress || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{log.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedLog(log); setDetailsOpen(true); }} aria-label="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(log.id)} aria-label="Delete log">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select
                    options={limitOptions.map((n) => ({ value: String(n), label: String(n) }))}
                    value={String(limit)}
                    onValueChange={(v) => setLimit(Number(v))}
                  />
                  <span>{total} total</span>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg" aria-describedby="audit-detail-description">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription id="audit-detail-description">Detailed information about this audit event</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">User</p>
                  <p className="text-sm">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Action</p>
                  <p className="text-sm">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Resource</p>
                  <p className="text-sm">{selectedLog.resource}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Resource ID</p>
                  <p className="text-sm font-mono">{selectedLog.resourceId || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Severity</p>
                  <span className={cn('mt-1 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', SEVERITY_COLORS[selectedLog.severity])}>
                    {selectedLog.severity}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">IP Address</p>
                  <p className="text-sm font-mono">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">User Agent</p>
                  <p className="text-xs truncate">{selectedLog.userAgent || '-'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{selectedLog.description || 'No description'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}