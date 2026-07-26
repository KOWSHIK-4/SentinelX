import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { IncidentForm } from '@/components/incidents/IncidentForm';
import { IncidentDetail } from '@/components/incidents/IncidentDetail';
import { ConfirmDialog } from '@/components/incidents/ConfirmDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableSkeleton, TableEmptyState } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { incidentApi, type Incident } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const severityColors: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

const statusBadgeVariants: Record<string, 'destructive' | 'warning' | 'success' | 'default'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const severityFilterOptions = [
  { value: '', label: 'All Severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const limitOptions = [10, 25, 50, 100];

export function Incidents() {
  useDocumentTitle('Incidents');
  const user = useAuthStore((s) => s.user);
  const roleName = user?.roles?.[0]?.name || '';
  const canCreate = roleName === 'Admin' || roleName === 'Analyst';
  const canEdit = roleName === 'Admin' || roleName === 'Analyst';
  const canDelete = roleName === 'Admin';

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const [filters, setFilters] = useState({ search: '', status: '', severity: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [showForm, setShowForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      if (sortField) {
        params.sortBy = sortField;
        params.sortOrder = sortDirection;
      }
      const res = await incidentApi.list(params);
      setIncidents(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, sortField, sortDirection]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);
  useEffect(() => { setPage(1); }, [filters, limit]);

  const handleCreate = async (data: { title: string; description: string; status: string; severity: string }) => {
    setSaving(true);
    try {
      const res = await incidentApi.create(data);
      setShowForm(false);
      setSuccess(res.message || 'Incident created successfully.');
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident.');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (data: { title: string; description: string; status: string; severity: string }) => {
    if (!editingIncident) return;
    setSaving(true);
    try {
      const res = await incidentApi.update(editingIncident.id, data);
      setEditingIncident(null);
      setShowForm(false);
      setSuccess(res.message || 'Incident updated successfully.');
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingIncident) return;
    setDeleting(true);
    try {
      const res = await incidentApi.delete(deletingIncident.id);
      setDeletingIncident(null);
      setSuccess(res.message || 'Incident deleted successfully.');
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete incident.');
    } finally { setDeleting(false); }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground mt-1">Track and manage security incidents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchIncidents} disabled={loading} className="gap-1">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={() => { setEditingIncident(null); setShowForm(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              New Incident
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Incidents</CardTitle>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search incidents..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="max-w-xs"
              aria-label="Search incidents"
            />
            <Select
              options={statusOptions}
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              className="w-[140px]"
              placeholder="Status"
            />
            <Select
              options={severityFilterOptions}
              value={filters.severity}
              onValueChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
              className="w-[140px]"
              placeholder="Severity"
            />
            {(filters.search || filters.status || filters.severity) && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', status: '', severity: '' })}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 mb-4" role="status">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 mb-4" role="alert">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : incidents.length === 0 ? (
            <TableEmptyState
              icon={AlertTriangle}
              title="No incidents found"
              description={filters.search || filters.status || filters.severity ? 'Try adjusting your search or filters.' : 'Create your first incident to get started.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortDirection={sortField === 'title' ? sortDirection : null} onSort={() => handleSort('title')}>Title</TableHead>
                      <TableHead sortable sortDirection={sortField === 'severity' ? sortDirection : null} onSort={() => handleSort('severity')}>Severity</TableHead>
                      <TableHead sortable sortDirection={sortField === 'status' ? sortDirection : null} onSort={() => handleSort('status')}>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead sortable sortDirection={sortField === 'createdAt' ? sortDirection : null} onSort={() => handleSort('createdAt')}>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => setViewingIncident(incident)}
                            className="text-left hover:text-primary transition-colors"
                          >
                            {incident.title}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityColors[incident.severity] || 'default'}>{incident.severity}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariants[incident.status] || 'default'}>
                            {incident.status === 'IN_PROGRESS' ? 'In Progress' : incident.status.charAt(0) + incident.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {incident.assignedUser ? `${incident.assignedUser.firstName} ${incident.assignedUser.lastName}` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatDate(incident.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => { setEditingIncident(incident); setShowForm(true); }}>
                                Edit
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingIncident(incident)}>
                                Delete
                              </Button>
                            )}
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
                  <span>{pagination.total} total</span>
                </div>
                <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <IncidentForm
        open={showForm}
        incident={editingIncident}
        onSave={editingIncident ? handleUpdate : handleCreate}
        onCancel={() => { setShowForm(false); setEditingIncident(null); }}
        loading={saving}
      />

      {viewingIncident && (
        <IncidentDetail
          incident={viewingIncident}
          onClose={() => setViewingIncident(null)}
        />
      )}

      <ConfirmDialog
        open={!!deletingIncident}
        title="Delete Incident"
        message={`Are you sure you want to delete "${deletingIncident?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeletingIncident(null)}
        loading={deleting}
      />
    </div>
  );
}