import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { Asset } from '@/lib/api';

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

const criticalityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
];

interface AssetFormProps {
  open: boolean;
  asset?: Asset | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AssetForm({ open, asset, onSave, onCancel, loading }: AssetFormProps) {
  const [assetName, setAssetName] = useState('');
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [assetType, setAssetType] = useState('SERVER');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [owner, setOwner] = useState('');
  const [department, setDepartment] = useState('');
  const [criticality, setCriticality] = useState('MEDIUM');
  const [status, setStatus] = useState('ACTIVE');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (asset) {
        setAssetName(asset.assetName);
        setHostname(asset.hostname || '');
        setIpAddress(asset.ipAddress || '');
        setAssetType(asset.assetType);
        setOperatingSystem(asset.operatingSystem || '');
        setOwner(asset.owner || '');
        setDepartment(asset.department || '');
        setCriticality(asset.criticality);
        setStatus(asset.status);
        setLocation(asset.location || '');
        setDescription(asset.description || '');
      } else {
        setAssetName('');
        setHostname('');
        setIpAddress('');
        setAssetType('SERVER');
        setOperatingSystem('');
        setOwner('');
        setDepartment('');
        setCriticality('MEDIUM');
        setStatus('ACTIVE');
        setLocation('');
        setDescription('');
      }
      setErrors({});
    }
  }, [open, asset]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!assetName.trim()) newErrors.assetName = 'Asset name is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      assetName: assetName.trim(),
      hostname: hostname.trim() || null,
      ipAddress: ipAddress.trim() || null,
      assetType,
      operatingSystem: operatingSystem.trim() || null,
      owner: owner.trim() || null,
      department: department.trim() || null,
      criticality,
      status,
      location: location.trim() || null,
      description: description.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{asset ? 'Edit Asset' : 'Create Asset'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetName">Asset Name *</Label>
              <Input id="assetName" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. Primary Web Server" />
              {errors.assetName && <p className="text-sm text-destructive">{errors.assetName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname</Label>
              <Input id="hostname" value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="e.g. web-01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="e.g. 10.0.1.10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Select id="assetType" options={assetTypeOptions} value={assetType} onChange={(e) => setAssetType(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatingSystem">Operating System</Label>
              <Input id="operatingSystem" value={operatingSystem} onChange={(e) => setOperatingSystem(e.target.value)} placeholder="e.g. Ubuntu 22.04" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. Infra Team" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. DC-1 Rack A3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criticality">Criticality</Label>
              <Select id="criticality" options={criticalityOptions} value={criticality} onChange={(e) => setCriticality(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details about this asset" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : asset ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
