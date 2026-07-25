import { useState, useEffect, useCallback } from 'react';
import { Plus, Server, RefreshCw } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/incidents/ConfirmDialog';
import { AssetForm } from '@/components/assets/AssetForm';
import { AssetDetail } from '@/components/assets/AssetDetail';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableSkeleton, TableEmptyState } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { assetApi, type Asset } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const criticalityColors: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  RETIRED: 'default',
};

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

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
];

const limitOptions = [10, 25, 50, 100];

export function Assets() {
  useDocumentTitle('Assets');
  const user = useAuthStore((s) => s.user);
  const roleName = user?.roles?.[0]?.name || '';
  const canCreate = roleName === 'Admin' || roleName === 'Analyst';
  const canEdit = roleName === 'Admin' || roleName === 'Analyst';
  const canDelete = roleName === 'Admin';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [assetType, setAssetType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasFilters = search || assetType || status;

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (assetType) params.assetType = assetType;
      if (status) params.status = status;
      const res = await assetApi.list(params);
      setAssets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets.');
    } finally { setLoading(false); }
  }, [page, limit, search, assetType, status]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  useEffect(() => { setPage(1); }, [search, assetType, status, limit]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortField) return 0;
    const dir = sortDirection === 'asc' ? 1 : -1;
    const aVal = String(a[sortField as keyof Asset] ?? '');
    const bVal = String(b[sortField as keyof Asset] ?? '');
    return aVal.localeCompare(bVal) * dir;
  });

  const handleCreate = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await assetApi.create(data as Parameters<typeof assetApi.create>[0]);
      setShowForm(false);
      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset.');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingAsset) return;
    setSaving(true);
    try {
      await assetApi.update(editingAsset.id, data as Parameters<typeof assetApi.update>[1]);
      setEditingAsset(null);
      setShowForm(false);
      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingAsset) return;
    setDeleting(true);
    try {
      await assetApi.delete(deletingAsset.id);
      setDeletingAsset(null);
      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset.');
    } finally { setDeleting(false); }
  };

  const clearFilters = () => { setSearch(''); setAssetType(''); setStatus(''); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your infrastructure assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAssets} disabled={loading} className="gap-1">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={() => { setEditingAsset(null); setShowForm(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              New Asset
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Asset Inventory</CardTitle>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
              aria-label="Search assets"
            />
            <Select options={assetTypeOptions} value={assetType} onValueChange={setAssetType} className="w-[140px]" placeholder="All Types" />
            <Select options={statusFilterOptions} value={status} onValueChange={setStatus} className="w-[140px]" placeholder="All Statuses" />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 mb-4" role="alert">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : sortedAssets.length === 0 ? (
            <TableEmptyState
              icon={Server}
              title="No assets found"
              description={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first asset to get started.'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortDirection={sortField === 'assetName' ? sortDirection : null} onSort={() => handleSort('assetName')}>Asset Name</TableHead>
                      <TableHead sortable sortDirection={sortField === 'assetType' ? sortDirection : null} onSort={() => handleSort('assetType')}>Type</TableHead>
                      <TableHead sortable sortDirection={sortField === 'criticality' ? sortDirection : null} onSort={() => handleSort('criticality')}>Criticality</TableHead>
                      <TableHead sortable sortDirection={sortField === 'status' ? sortDirection : null} onSort={() => handleSort('status')}>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => setViewingAsset(asset)}
                            className="text-left hover:text-primary transition-colors"
                          >
                            {asset.assetName}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{asset.assetType.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Badge variant={criticalityColors[asset.criticality] || 'default'}>{asset.criticality}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[asset.status] || 'default'}>
                            {asset.status === 'MAINTENANCE' ? 'Maint' : asset.status.charAt(0) + asset.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{asset.ipAddress || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => { setEditingAsset(asset); setShowForm(true); }}>Edit</Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingAsset(asset)}>Delete</Button>
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

      <AssetForm
        open={showForm}
        asset={editingAsset}
        onSave={editingAsset ? handleUpdate : handleCreate}
        onCancel={() => { setShowForm(false); setEditingAsset(null); }}
        loading={saving}
      />

      {viewingAsset && <AssetDetail asset={viewingAsset} onClose={() => setViewingAsset(null)} />}

      <ConfirmDialog
        open={!!deletingAsset}
        title="Delete Asset"
        message={`Are you sure you want to delete "${deletingAsset?.assetName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeletingAsset(null)}
        loading={deleting}
      />
    </div>
  );
}