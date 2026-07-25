import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, AlertTriangle, Server, FileText, Users, Bell, ScrollText, Activity, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from '@/lib/utils';
import { incidentApi, assetApi, teamApi, notificationApi, auditApi, type Incident, type Asset, type TeamMember, type Notification, type AuditLog } from '@/lib/api';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: 'Incidents' | 'Assets' | 'Reports' | 'Team Members' | 'Notifications' | 'Audit Logs';
  href: string;
}

const categoryIcons: Record<string, typeof Activity> = {
  Incidents: AlertTriangle,
  Assets: Server,
  Reports: FileText,
  'Team Members': Users,
  Notifications: Bell,
  'Audit Logs': ScrollText,
};

const categoryColors: Record<string, string> = {
  Incidents: 'text-red-500',
  Assets: 'text-blue-500',
  Reports: 'text-emerald-500',
  'Team Members': 'text-purple-500',
  Notifications: 'text-amber-500',
  'Audit Logs': 'text-slate-500',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useKeyboardShortcut('k', 'ctrlMeta', useCallback(() => {
    setOpen((prev) => !prev);
  }, []));

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const [incidentsRes, assetsRes, teamRes, notificationsRes, auditRes] = await Promise.all([
          incidentApi.list({ search: q, limit: '3' }).catch(() => null),
          assetApi.list({ search: q, limit: '3' }).catch(() => null),
          teamApi.list().catch(() => null),
          notificationApi.list().catch(() => null),
          auditApi.list({ search: q, limit: '3' }).catch(() => null),
        ]);

        const allResults: SearchResult[] = [];

        if (incidentsRes?.data) {
          incidentsRes.data.forEach((inc: Incident) => {
            allResults.push({
              id: inc.id,
              title: inc.title,
              description: `${inc.severity} · ${inc.status}`,
              category: 'Incidents',
              href: '/dashboard/incidents',
            });
          });
        }

        if (assetsRes?.data) {
          assetsRes.data.forEach((asset: Asset) => {
            allResults.push({
              id: asset.id,
              title: asset.assetName,
              description: `${asset.assetType} · ${asset.ipAddress || 'No IP'}`,
              category: 'Assets',
              href: '/dashboard/assets',
            });
          });
        }

        if (teamRes?.data) {
          teamRes.data
            .filter((m: TeamMember) =>
              `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q.toLowerCase()),
            )
            .slice(0, 3)
            .forEach((m: TeamMember) => {
              allResults.push({
                id: m.id,
                title: `${m.firstName} ${m.lastName}`,
                description: m.email,
                category: 'Team Members',
                href: '/dashboard/team',
              });
            });
        }

        if (notificationsRes?.data) {
          notificationsRes.data
            .filter((n: Notification) =>
              `${n.title} ${n.message}`.toLowerCase().includes(q.toLowerCase()),
            )
            .slice(0, 3)
            .forEach((n: Notification) => {
              allResults.push({
                id: n.id,
                title: n.title,
                description: n.message,
                category: 'Notifications',
                href: '/dashboard/notifications',
              });
            });
        }

        if (auditRes?.data) {
          auditRes.data.forEach((log: AuditLog) => {
            allResults.push({
              id: log.id,
              title: `${log.action} on ${log.resource}`,
              description: `${log.userName} · ${log.severity}`,
              category: 'Audit Logs',
              href: '/dashboard/audit',
            });
          });
        }

        setResults(allResults);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
              onKeyDown={handleKeyDown}
              placeholder="Search incidents, assets, team members..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search query"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border/40 bg-muted px-2 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {!loading && query && Object.keys(groupedResults).length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              </div>
            )}

            {!loading && Object.entries(groupedResults).map(([category, items]) => {
              const Icon = categoryIcons[category] || Search;
              return (
                <div key={category} className="mb-2">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Icon className={cn('h-3.5 w-3.5', categoryColors[category])} />
                    <span className="text-xs font-medium text-muted-foreground">{category}</span>
                  </div>
                  {items.map((result) => {
                    const globalIdx = Object.values(groupedResults).flat().indexOf(result);
                    return (
                      <button
                        key={`${result.category}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          'w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                          globalIdx === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{result.description}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {!query && !loading && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Type to search across all modules</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Press <kbd className="rounded border border-border/40 bg-muted px-1.5 py-0.5 text-[10px]">Esc</kbd> to close
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}