import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import type { Asset } from '@/lib/api';
import { X, Calendar, Server, Monitor, Network } from 'lucide-react';

interface AssetDetailProps {
  asset: Asset;
  onClose: () => void;
}

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

const typeIcons: Record<string, typeof Server> = {
  SERVER: Server,
  WORKSTATION: Monitor,
  LAPTOP: Monitor,
  FIREWALL: Network,
  SWITCH: Network,
  ROUTER: Network,
  CLOUD_VM: Server,
  DATABASE: Server,
  OTHER: Server,
};

export function AssetDetail({ asset, onClose }: AssetDetailProps) {
  const TypeIcon = typeIcons[asset.assetType] || Server;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl rounded-lg border bg-card shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <TypeIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{asset.assetName}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={criticalityColors[asset.criticality] || 'default'}>
              {asset.criticality}
            </Badge>
            <Badge variant={statusColors[asset.status] || 'default'}>
              {asset.status === 'MAINTENANCE' ? 'Maintenance' : asset.status.charAt(0) + asset.status.slice(1).toLowerCase()}
            </Badge>
            <Badge variant="secondary">{asset.assetType}</Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Hostname:</span>
              <p className="font-medium">{asset.hostname || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">IP Address:</span>
              <p className="font-medium">{asset.ipAddress || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Operating System:</span>
              <p className="font-medium">{asset.operatingSystem || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Owner:</span>
              <p className="font-medium">{asset.owner || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Department:</span>
              <p className="font-medium">{asset.department || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <p className="font-medium">{asset.location || '-'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(asset.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated:</span>
              <span>{formatDate(asset.updatedAt)}</span>
            </div>
          </div>

          {asset.description && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">{asset.description}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
