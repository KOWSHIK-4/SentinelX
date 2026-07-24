import { useState, useEffect, useCallback } from 'react';
import { Plus, Server, RefreshCw, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/incidents/ConfirmDialog';
import { AssetForm } from '@/components/assets/AssetForm';
import { AssetDetail } from '@/components/assets/AssetDetail';
import { assetApi, type Asset } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const assetTypeOptions = [
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

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
];

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

export function Assets() {
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
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (assetType) params.assetType = assetType;
      if (status) params.status = status;

      const res = await assetApi.list(params);
      setAssets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets.');
    } finally {
      setLoading(false);
    }
  }, [page, search, assetType, status]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    setPage(1);
  }, [search, assetType, status]);

  const handleCreate = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await assetApi.create(data as Parameters<typeof assetApi.create>[0]);
      setShowForm(false);
      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset.');
    } finally {
      setSaving(false);
    }
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
    } finally {
      setSaving(false);
    }
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
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setAssetType('');
    setStatus('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your infrastructure assets.</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setEditingAsset(null); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Asset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Asset Inventory</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchAssets} disabled={loading} className="gap-1">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-[160px]">
              <Select
                placeholder="All types"
                options={assetTypeOptions}
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
              />
            </div>
            <div className="w-[160px]">
              <Select
                placeholder="All statuses"
                options={statusOptions}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
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
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No assets found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Add your first asset to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setViewingAsset(asset)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{asset.assetName}</p>
                      {asset.hostname && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          ({asset.hostname})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {asset.assetType} {asset.ipAddress ? `\u00b7 ${asset.ipAddress}` : ''} {asset.department ? `\u00b7 ${asset.department}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Badge variant={criticalityColors[asset.criticality] || 'default'}>
                      {asset.criticality}
                    </Badge>
                    <Badge variant={statusColors[asset.status] || 'default'}>
                      {asset.status === 'MAINTENANCE' ? 'Maint' : asset.status.charAt(0) + asset.status.slice(1).toLowerCase()}
                    </Badge>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setShowForm(true); }}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeletingAsset(asset); }}
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

      <AssetForm
        open={showForm}
        asset={editingAsset}
        onSave={editingAsset ? handleUpdate : handleCreate}
        onCancel={() => { setShowForm(false); setEditingAsset(null); }}
        loading={saving}
      />

      {viewingAsset && (
        <AssetDetail
          asset={viewingAsset}
          onClose={() => setViewingAsset(null)}
        />
      )}

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
