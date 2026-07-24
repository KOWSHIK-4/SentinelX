import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/incidents/ConfirmDialog';
import { teamApi, type TeamMember } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const roleBadgeVariants: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  Admin: 'destructive',
  Analyst: 'warning',
  Viewer: 'default',
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface TeamMemberFormProps {
  open: boolean;
  member?: TeamMember | null;
  onSave: (data: { email: string; firstName: string; lastName: string; roleName: string; password?: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function TeamMemberForm({ open, member, onSave, onCancel, loading }: TeamMemberFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleName, setRoleName] = useState('Viewer');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (member) {
        setEmail(member.email);
        setFirstName(member.firstName);
        setLastName(member.lastName);
        setRoleName(member.roles[0]?.name || 'Viewer');
        setPassword('');
      } else {
        setEmail('');
        setFirstName('');
        setLastName('');
        setRoleName('Viewer');
        setPassword('');
      }
      setErrors({});
    }
  }, [open, member]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = 'Email is required.';
    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!member && !password) newErrors.password = 'Password is required.';
    if (password && password.length < 8) newErrors.password = 'Password must be at least 8 characters.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data: { email: string; firstName: string; lastName: string; roleName: string; password?: string } = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      roleName,
    };
    if (password) data.password = password;
    onSave(data);
  };

  const roleOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Analyst', label: 'Analyst' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{member ? 'Edit Team Member' : 'Invite Team Member'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">First Name</label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Name</label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
            </div>
          </div>
          {!member && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
            <Select id="role" options={roleOptions} value={roleName} onValueChange={setRoleName} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : member ? 'Update' : 'Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Team() {
  const user = useAuthStore((s) => s.user);
  const roleName = user?.roles?.[0]?.name || '';
  const canManage = roleName === 'Admin';

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teamApi.list();
      setMembers(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = members.filter((member) => {
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      if (!fullName.includes(q) && !member.email.toLowerCase().includes(q)) return false;
    }
    if (roleFilter && !member.roles.some((r) => r.name === roleFilter)) return false;
    if (statusFilter === 'active' && !member.isActive) return false;
    if (statusFilter === 'inactive' && member.isActive) return false;
    return true;
  });

  const handleCreate = async (data: { email: string; firstName: string; lastName: string; roleName: string; password?: string }) => {
    setSaving(true);
    try {
      await teamApi.create(data as { email: string; password: string; firstName: string; lastName: string; roleName: string });
      setShowForm(false);
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team member.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: { email: string; firstName: string; lastName: string; roleName: string; password?: string }) => {
    if (!editingMember) return;
    setSaving(true);
    try {
      const updateData: { email?: string; firstName?: string; lastName?: string; roleName?: string } = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roleName: data.roleName,
      };
      await teamApi.update(editingMember.id, updateData);
      setEditingMember(null);
      setShowForm(false);
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    setDeleting(true);
    try {
      await teamApi.delete(deletingMember.id);
      setDeletingMember(null);
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team member.');
    } finally {
      setDeleting(false);
    }
  };

  const roleFilterOptions = [
    { value: '', label: 'All Roles' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Analyst', label: 'Analyst' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  const statusFilterOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your security operations team.</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditingMember(null); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Team Members</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchMembers} disabled={loading} className="gap-1">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select options={roleFilterOptions} value={roleFilter} onValueChange={setRoleFilter} className="w-[140px]" />
            <Select options={statusFilterOptions} value={statusFilter} onValueChange={setStatusFilter} className="w-[140px]" />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No team members found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || roleFilter || statusFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Invite your first team member to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Last Login</th>
                    {canManage && <th className="pb-3 text-sm font-medium text-muted-foreground text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={getAvatarColor(member.firstName)}>
                              {getInitials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">{member.email}</td>
                      <td className="py-3">
                        <Badge variant={roleBadgeVariants[member.roles[0]?.name] || 'default'}>
                          {member.roles[0]?.name || 'Viewer'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={member.isActive ? 'success' : 'secondary'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {member.lastLogin ? formatDate(member.lastLogin) : 'Never'}
                      </td>
                      {canManage && (
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingMember(member); setShowForm(true); }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingMember(member)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TeamMemberForm
        open={showForm}
        member={editingMember}
        onSave={editingMember ? handleUpdate : handleCreate}
        onCancel={() => { setShowForm(false); setEditingMember(null); }}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deletingMember}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${deletingMember?.firstName} ${deletingMember?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeletingMember(null)}
        loading={deleting}
      />
    </div>
  );
}
