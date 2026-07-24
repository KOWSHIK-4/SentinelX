import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import type { Incident } from '@/lib/api';
import { X, Calendar, User, AlertTriangle } from 'lucide-react';

interface IncidentDetailProps {
  incident: Incident;
  onClose: () => void;
}

const severityColors: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

const statusColors: Record<string, 'destructive' | 'warning' | 'success' | 'default'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

export function IncidentDetail({ incident, onClose }: IncidentDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl rounded-lg border bg-card shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-xl font-semibold">{incident.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={severityColors[incident.severity] || 'default'}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {incident.severity}
            </Badge>
            <Badge variant={statusColors[incident.status] || 'default'}>
              {incident.status === 'IN_PROGRESS' ? 'In Progress' : incident.status.charAt(0) + incident.status.slice(1).toLowerCase()}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{incident.description}</p>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created by:</span>
              <span>{incident.createdBy.firstName} {incident.createdBy.lastName}</span>
            </div>
            {incident.assignedUser && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span>{incident.assignedUser.firstName} {incident.assignedUser.lastName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(incident.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated:</span>
              <span>{formatDate(incident.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
