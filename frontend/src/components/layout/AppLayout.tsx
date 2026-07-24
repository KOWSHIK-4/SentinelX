import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function AppLayout() {
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setUnreadCount(data.data.filter((n: { isRead: boolean }) => !n.isRead).length);
          }
        }
      } catch {
        // silently fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token, setUnreadCount]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <header className="fixed right-0 top-0 z-30 flex h-16 items-center justify-end gap-3 border-b border-border/40 bg-background/80 backdrop-blur-lg pl-64 pr-6 w-full">
        <ThemeToggle />
        <Link to="/dashboard/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
      </header>
      <main className="pl-64 pt-16">
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
