import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, statusOptions, severityOptions } from '@/components/ui/select';
import type { Incident } from '@/lib/api';

interface IncidentFormProps {
  open: boolean;
  incident?: Incident | null;
  onSave: (data: { title: string; description: string; status: string; severity: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function IncidentForm({ open, incident, onSave, onCancel, loading }: IncidentFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [severity, setSeverity] = useState('MEDIUM');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (incident) {
        setTitle(incident.title);
        setDescription(incident.description);
        setStatus(incident.status);
        setSeverity(incident.severity);
      } else {
        setTitle('');
        setDescription('');
        setStatus('OPEN');
        setSeverity('MEDIUM');
      }
      setErrors({});
    }
  }, [open, incident]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({ title: title.trim(), description: description.trim(), status, severity });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{incident ? 'Edit Incident' : 'Create Incident'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title" />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the incident" rows={5} />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select id="severity" options={severityOptions} value={severity} onChange={(e) => setSeverity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : incident ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
