import { NavLink } from 'react-router-dom';
import {
  Shield,
  Activity,
  AlertTriangle,
  Server,
  Settings,
  Users,
  FileText,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { icon: Activity, label: 'Overview', href: '/dashboard' },
  { icon: AlertTriangle, label: 'Incidents', href: '/dashboard/incidents' },
  { icon: Server, label: 'Assets', href: '/dashboard/assets' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: FileText, label: 'Reports', href: '/dashboard/reports' },
  { icon: Users, label: 'Team', href: '/dashboard/team' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border/40 bg-background">
      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">SOC Dashboard</span>
        </div>
        {sidebarItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
