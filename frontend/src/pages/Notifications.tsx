import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellOff,
  RefreshCw,
  CheckCheck,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  UserPlus,
  Server,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/incidents/ConfirmDialog';
import { notificationApi, type Notification } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';

const severityColors: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

const typeIcons: Record<string, typeof Bell> = {
  'Incident Created': AlertTriangle,
  'Incident Updated': Activity,
  'Critical Incident': ShieldAlert,
  'Asset Added': Server,
  'Asset Updated': Server,
  'Team Invitation': UserPlus,
  'System Alert': Bell,
};

const severityFilters = [
  { value: '', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationApi.list();
      setNotifications(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter && filter !== 'UNREAD') return n.severity === filter;
    return true;
  });

  const { setUnreadCount, decrementUnread, resetUnread } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => { setUnreadCount(unreadCount); }, [notifications, setUnreadCount, unreadCount]);

  const hasFilters = filter !== '';
  const hasReadNotifications = notifications.some((n) => n.isRead);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      decrementUnread();
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
    } catch {
      // silently fail
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await notificationApi.delete(deletingId);
      setNotifications((prev) => prev.filter((n) => n.id !== deletingId));
      setDeletingId(null);
    } catch {
      // silently fail
    }
  };

  const handleClearRead = async () => {
    const readIds = notifications.filter((n) => n.isRead).map((n) => n.id);
    for (const id of readIds) {
      try { await notificationApi.delete(id); } catch { /* ignore */ }
    }
    setNotifications((prev) => prev.filter((n) => !n.isRead));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`
              : 'All caught up.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading} className="gap-1">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-1">
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          {hasReadNotifications && (
            <Button variant="outline" size="sm" onClick={handleClearRead} className="gap-1">
              <Trash2 className="h-4 w-4" />
              Clear Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notifications</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter notifications">
            {severityFilters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 mb-4" role="alert">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchNotifications} className="mt-2">Retry</Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters ? 'Try adjusting your filter.' : 'You have no notifications at this time.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                      !notification.isRead ? 'bg-primary/5 border-primary/20' : 'hover:bg-accent/50'
                    }`}
                    role="listitem"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <Badge variant={severityColors[notification.severity] || 'default'}>{notification.severity}</Badge>
                        {!notification.isRead && (
                          <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</span>
                        {notification.link && (
                          <a href={notification.link} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      {!notification.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)} title="Mark as read" aria-label="Mark as read">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingId(notification.id)} title="Delete" aria-label="Delete notification">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deletingId}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}