import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IncidentFilters } from '@/components/incidents/IncidentFilters';
import { IncidentForm } from '@/components/incidents/IncidentForm';
import { IncidentDetail } from '@/components/incidents/IncidentDetail';
import { ConfirmDialog } from '@/components/incidents/ConfirmDialog';
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

export function Incidents() {
  const user = useAuthStore((s) => s.user);
  const roleName = user?.roles?.[0]?.name || '';
  const canCreate = roleName === 'Admin' || roleName === 'Analyst';
  const canEdit = roleName === 'Admin' || roleName === 'Analyst';
  const canDelete = roleName === 'Admin';

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ search: '', status: '', severity: '' });
  const [page, setPage] = useState(1);

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
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;

      const res = await incidentApi.list(params);
      setIncidents(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleCreate = async (data: { title: string; description: string; status: string; severity: string }) => {
    setSaving(true);
    try {
      await incidentApi.create(data);
      setShowForm(false);
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: { title: string; description: string; status: string; severity: string }) => {
    if (!editingIncident) return;
    setSaving(true);
    try {
      await incidentApi.update(editingIncident.id, data);
      setEditingIncident(null);
      setShowForm(false);
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update incident.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingIncident) return;
    setDeleting(true);
    try {
      await incidentApi.delete(deletingIncident.id);
      setDeletingIncident(null);
      fetchIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete incident.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground mt-1">Track and manage security incidents.</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setEditingIncident(null); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Incident
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Incidents</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchIncidents} disabled={loading} className="gap-1">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="mt-3">
            <IncidentFilters filters={filters} onFilterChange={setFilters} />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No incidents found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filters.search || filters.status || filters.severity
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first incident to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setViewingIncident(incident)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{incident.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {incident.createdBy.firstName} {incident.createdBy.lastName} &middot; {formatDate(incident.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Badge variant={severityColors[incident.severity] || 'default'}>
                      {incident.severity}
                    </Badge>
                    <Badge variant={statusBadgeVariants[incident.status] || 'default'}>
                      {incident.status === 'IN_PROGRESS' ? 'In Progress' : incident.status.charAt(0) + incident.status.slice(1).toLowerCase()}
                    </Badge>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setEditingIncident(incident); setShowForm(true); }}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeletingIncident(incident); }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
