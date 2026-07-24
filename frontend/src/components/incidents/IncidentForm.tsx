import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, statusOptions, severityOptions } from '@/components/ui/select';
import { assetApi, type Asset, type Incident } from '@/lib/api';
import { X } from 'lucide-react';

interface IncidentFormProps {
  open: boolean;
  incident?: Incident | null;
  onSave: (data: { title: string; description: string; status: string; severity: string; assetIds?: string[] }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function IncidentForm({ open, incident, onSave, onCancel, loading }: IncidentFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [severity, setSeverity] = useState('MEDIUM');
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (open) {
      if (incident) {
        setTitle(incident.title);
        setDescription(incident.description);
        setStatus(incident.status);
        setSeverity(incident.severity);
        setAssetIds(incident.assets?.map((a) => a.asset.id) || []);
      } else {
        setTitle('');
        setDescription('');
        setStatus('OPEN');
        setSeverity('MEDIUM');
        setAssetIds([]);
      }
      setErrors({});
      setSearchTerm('');
    }
  }, [open, incident]);

  useEffect(() => {
    if (showDropdown) {
      setAssetsLoading(true);
      assetApi.list({ limit: '50', search: searchTerm })
        .then((res) => setAssets(res.data))
        .catch(() => {})
        .finally(() => setAssetsLoading(false));
    }
  }, [showDropdown, searchTerm]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({ title: title.trim(), description: description.trim(), status, severity, assetIds: assetIds.length > 0 ? assetIds : undefined });
  };

  const toggleAsset = (id: string) => {
    setAssetIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const selectedAssets = assets.filter((a) => assetIds.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{incident ? 'Edit Incident' : 'Create Incident'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title" />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the incident" rows={5} />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select id="severity" options={severityOptions} value={severity} onChange={(e) => setSeverity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Affected Assets</Label>
            <div className="relative">
              <Input
                placeholder="Search and select assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg max-h-48 overflow-y-auto">
                  {assetsLoading ? (
                    <p className="p-2 text-sm text-muted-foreground">Loading...</p>
                  ) : assets.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">No assets found.</p>
                  ) : (
                    assets.map((asset) => (
                      <label
                        key={asset.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={assetIds.includes(asset.id)}
                          onChange={() => toggleAsset(asset.id)}
                          className="rounded"
                        />
                        <span className="font-medium">{asset.assetName}</span>
                        <span className="text-muted-foreground text-xs">
                          {asset.assetType} {asset.ipAddress ? `\u00b7 ${asset.ipAddress}` : ''}
                        </span>
                      </label>
                    ))
                  )}
                  <button
                    type="button"
                    className="w-full p-2 text-xs text-muted-foreground hover:bg-accent border-t"
                    onClick={() => setShowDropdown(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedAssets.map((asset) => (
                  <span
                    key={asset.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {asset.assetName}
                    <button
                      type="button"
                      onClick={() => toggleAsset(asset.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : incident ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
