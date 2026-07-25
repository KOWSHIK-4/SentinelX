import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bell, Search, ArrowUp, Command } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notificationStore';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { notificationApi } from '@/lib/api';

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return visible ? (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  ) : null;
}

export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationApi.list();
        if (res.success && Array.isArray(res.data)) {
          setUnreadCount(res.data.filter((n) => !n.isRead).length);
        }
      } catch {
        // silently fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {searchOpen && <GlobalSearch />}
      <header className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/40 bg-background/80 backdrop-blur-lg pl-64 pr-6 w-full">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors ml-4 w-full max-w-sm"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search anything...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/40 bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
        <div className="flex items-center gap-2">
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
        </div>
      </header>
      <main className="pl-64 pt-16">
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
      <ScrollToTop />
    </div>
  );
}