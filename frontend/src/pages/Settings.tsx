import { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Palette,
  Lock,
  SunMoon,
  Bell,
  Monitor,
  Save,
  RotateCcw,
  Upload,
  AlertTriangle,
 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast';
import { settingsApi, type SettingsData, type SystemInfo } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Denver', label: 'America/Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST)' },
];

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

type SettingsState = SettingsData;
type TabId = 'organization' | 'branding' | 'security' | 'appearance' | 'notifications' | 'system';

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: SunMoon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'system', label: 'System', icon: Monitor },
];

function SkeletonField() {
  return <Skeleton className="h-9 w-full" />;
}

function SectionCard({ title, description, children, icon: Icon }: { title: string; description?: string; children: React.ReactNode; icon?: typeof Building2 }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center', className)}>
      <Label className="sm:col-span-1 text-muted-foreground">{label}</Label>
      <div className="sm:col-span-3">{children}</div>
    </div>
  );
}

function SystemStatusBadge({ status, label }: { status: string; label: string }) {
  const isOk = ['connected', 'healthy', 'running'].includes(status);
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium flex items-center gap-1.5', isOk ? 'text-emerald-500' : 'text-red-500')}>
        <span className={cn('inline-block h-2 w-2 rounded-full', isOk ? 'bg-emerald-500' : 'bg-red-500')} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}

export function Settings() {
  useDocumentTitle('Settings');
  const [activeTab, setActiveTab] = useState<TabId>('organization');
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [originalSettings, setOriginalSettings] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  const hasUnsavedChanges = settings && originalSettings && JSON.stringify(settings) !== originalSettings;

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, systemRes] = await Promise.all([
        settingsApi.get(),
        settingsApi.getSystemInfo(),
      ]);
      setSettings(settingsRes.data);
      setOriginalSettings(JSON.stringify(settingsRes.data));
      setSystemInfo(systemRes.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateField = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await settingsApi.update(settings);
      setSettings(res.data);
      setOriginalSettings(JSON.stringify(res.data));
      toast({ title: 'Success', description: res.message || 'Settings saved successfully.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await settingsApi.reset();
      setSettings(res.data);
      setOriginalSettings(JSON.stringify(res.data));
      toast({ title: 'Settings Reset', description: res.message || 'Settings reset to defaults.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to reset settings.', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const handleLogoUpload = () => {
    toast({ title: 'Coming Soon', description: 'Logo upload via file picker will be available in a future release.' });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center">
                      <Skeleton className="h-4 w-24" />
                      <div className="sm:col-span-3">
                        <SkeletonField />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Failed to load settings.</p>
        <Button variant="outline" className="mt-4" onClick={fetchSettings}>
          Retry
        </Button>
      </div>
    );
  }

  const renderOrganization = () => (
    <SectionCard title="Organization" description="Manage your organization details." icon={Building2}>
      <FieldRow label="Organization Name">
        <Input
          value={settings.organizationName}
          onChange={(e) => updateField('organizationName', e.target.value)}
          placeholder="Enter organization name"
        />
      </FieldRow>
      <FieldRow label="Company Name">
        <Input
          value={settings.companyName || ''}
          onChange={(e) => updateField('companyName', e.target.value || null)}
          placeholder="Enter company name"
        />
      </FieldRow>
      <FieldRow label="Industry">
        <Input
          value={settings.industry || ''}
          onChange={(e) => updateField('industry', e.target.value || null)}
          placeholder="e.g. Cybersecurity, Technology, Finance"
        />
      </FieldRow>
      <FieldRow label="Website">
        <Input
          value={settings.website || ''}
          onChange={(e) => updateField('website', e.target.value || null)}
          placeholder="https://example.com"
        />
      </FieldRow>
      <FieldRow label="Email">
        <Input
          type="email"
          value={settings.email || ''}
          onChange={(e) => updateField('email', e.target.value || null)}
          placeholder="contact@example.com"
        />
      </FieldRow>
      <FieldRow label="Phone">
        <Input
          value={settings.phone || ''}
          onChange={(e) => updateField('phone', e.target.value || null)}
          placeholder="+1 234 567 8900"
        />
      </FieldRow>
      <FieldRow label="Time Zone">
        <Select
          options={TIMEZONE_OPTIONS}
          value={settings.timeZone || 'UTC'}
          onValueChange={(v) => updateField('timeZone', v)}
        />
      </FieldRow>
      <FieldRow label="Address">
        <Input
          value={settings.address || ''}
          onChange={(e) => updateField('address', e.target.value || null)}
          placeholder="Enter address"
        />
      </FieldRow>
    </SectionCard>
  );

  const renderBranding = () => (
    <SectionCard title="Branding" description="Customize your platform appearance." icon={Palette}>
      <FieldRow label="Logo">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLogoUpload}>
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
            {settings.logoUrl && (
              <Button variant="ghost" size="sm" onClick={() => updateField('logoUrl', null)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </FieldRow>
      <FieldRow label="Primary Color">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.primaryColor || '#2563eb'}
            onChange={(e) => updateField('primaryColor', e.target.value)}
            className="h-9 w-12 rounded-md border border-input bg-transparent p-0.5 cursor-pointer"
          />
          <Input
            value={settings.primaryColor || ''}
            onChange={(e) => updateField('primaryColor', e.target.value || null)}
            placeholder="#2563eb"
            className="font-mono"
          />
        </div>
      </FieldRow>
      <FieldRow label="Accent Color">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.accentColor || '#7c3aed'}
            onChange={(e) => updateField('accentColor', e.target.value)}
            className="h-9 w-12 rounded-md border border-input bg-transparent p-0.5 cursor-pointer"
          />
          <Input
            value={settings.accentColor || ''}
            onChange={(e) => updateField('accentColor', e.target.value || null)}
            placeholder="#7c3aed"
            className="font-mono"
          />
        </div>
      </FieldRow>
      <FieldRow label="App Name">
        <Input
          value={settings.applicationName || ''}
          onChange={(e) => updateField('applicationName', e.target.value || null)}
          placeholder="SentinelX"
        />
      </FieldRow>
    </SectionCard>
  );

  const renderSecurity = () => (
    <SectionCard title="Security" description="Configure password policies and session settings." icon={Lock}>
      <FieldRow label="Min Password Length">
        <Input
          type="number"
          min={8}
          max={32}
          value={settings.passwordMinLength}
          onChange={(e) => updateField('passwordMinLength', Math.max(8, Math.min(32, parseInt(e.target.value) || 8)))}
        />
      </FieldRow>
      <FieldRow label="Require Uppercase">
        <Switch checked={settings.requireUppercase} onCheckedChange={(v) => updateField('requireUppercase', v)} />
      </FieldRow>
      <FieldRow label="Require Numbers">
        <Switch checked={settings.requireNumbers} onCheckedChange={(v) => updateField('requireNumbers', v)} />
      </FieldRow>
      <FieldRow label="Require Symbols">
        <Switch checked={settings.requireSymbols} onCheckedChange={(v) => updateField('requireSymbols', v)} />
      </FieldRow>
      <FieldRow label="Session Timeout (min)">
        <Input
          type="number"
          min={5}
          max={1440}
          value={settings.sessionTimeoutMinutes}
          onChange={(e) => updateField('sessionTimeoutMinutes', Math.max(5, Math.min(1440, parseInt(e.target.value) || 5)))}
        />
      </FieldRow>
      <FieldRow label="Multi-Factor Auth">
        <div className="flex items-center gap-3">
          <Switch checked={settings.mfaEnabled} onCheckedChange={(v) => updateField('mfaEnabled', v)} />
          <span className="text-sm text-muted-foreground">
            {settings.mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </FieldRow>
    </SectionCard>
  );

  const renderAppearance = () => (
    <SectionCard title="Appearance" description="Customize the look and feel." icon={SunMoon}>
      <FieldRow label="Theme">
        <Select
          options={THEME_OPTIONS}
          value={settings.theme || 'system'}
          onValueChange={(v) => updateField('theme', v as 'dark' | 'light' | 'system')}
        />
      </FieldRow>
      <FieldRow label="Sidebar Collapsed">
        <div className="flex items-center gap-3">
          <Switch checked={settings.sidebarCollapsed} onCheckedChange={(v) => updateField('sidebarCollapsed', v)} />
          <span className="text-sm text-muted-foreground">
            {settings.sidebarCollapsed ? 'Collapsed by default' : 'Expanded by default'}
          </span>
        </div>
      </FieldRow>
      <FieldRow label="Compact Mode">
        <div className="flex items-center gap-3">
          <Switch checked={settings.compactMode} onCheckedChange={(v) => updateField('compactMode', v)} />
          <span className="text-sm text-muted-foreground">
            {settings.compactMode ? 'Compact' : 'Default'}
          </span>
        </div>
      </FieldRow>
    </SectionCard>
  );

  const renderNotifications = () => (
    <SectionCard title="Notifications" description="Configure notification preferences." icon={Bell}>
      <FieldRow label="Email Notifications">
        <Switch checked={settings.emailNotifications} onCheckedChange={(v) => updateField('emailNotifications', v)} />
      </FieldRow>
      <FieldRow label="Browser Notifications">
        <Switch checked={settings.browserNotifications} onCheckedChange={(v) => updateField('browserNotifications', v)} />
      </FieldRow>
      <FieldRow label="Critical Alerts">
        <Switch checked={settings.criticalAlerts} onCheckedChange={(v) => updateField('criticalAlerts', v)} />
      </FieldRow>
      <FieldRow label="Daily Summary">
        <Switch checked={settings.dailySummaryEmails} onCheckedChange={(v) => updateField('dailySummaryEmails', v)} />
      </FieldRow>
    </SectionCard>
  );

  const renderSystem = () => (
    <SectionCard title="System" description="System status and health information." icon={Monitor}>
      <div className="space-y-3">
        <SystemStatusBadge status={systemInfo?.databaseStatus || 'unknown'} label="Database Status" />
        <SystemStatusBadge status={systemInfo?.apiStatus || 'unknown'} label="API Status" />
        <SystemStatusBadge status={systemInfo?.dockerStatus || 'unknown'} label="Docker Status" />
      </div>
      <Separator className="my-4" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Application Version</span>
          <p className="mt-1 text-sm font-medium">{systemInfo?.applicationVersion || 'N/A'}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Last Backup</span>
          <p className="mt-1 text-sm font-medium">
            {systemInfo?.lastBackupTime
              ? new Date(systemInfo.lastBackupTime).toLocaleString()
              : 'N/A'}
          </p>
        </div>
      </div>
    </SectionCard>
  );

  const tabContent: Record<TabId, () => React.ReactNode> = {
    organization: renderOrganization,
    branding: renderBranding,
    security: renderSecurity,
    appearance: renderAppearance,
    notifications: renderNotifications,
    system: renderSystem,
  };

  return (
    <ToastProvider>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your platform configuration.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={resetting || saving}
            >
              <RotateCcw className={cn('h-4 w-4 mr-1.5', resetting && 'animate-spin')} />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving || resetting || !hasUnsavedChanges}>
              <Save className={cn('h-4 w-4 mr-1.5', saving && 'animate-spin')} />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            You have unsaved changes. Make sure to save before leaving.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <div className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {tabContent[activeTab]()}
          </div>
        </div>
      </div>

      <ToastViewport />
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant as 'default' | 'success' | 'destructive' | undefined}>
          <div className="grid gap-1">
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose onClick={() => dismiss(t.id)} />
        </Toast>
      ))}
    </ToastProvider>
  );
}
