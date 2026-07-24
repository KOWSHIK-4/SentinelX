import { Input } from '@/components/ui/input';
import { Select, statusOptions, severityOptions } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface FilterValues {
  search: string;
  status: string;
  severity: string;
}

interface IncidentFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
}

export function IncidentFilters({ filters, onFilterChange }: IncidentFiltersProps) {
  const hasFilters = filters.search || filters.status || filters.severity;

  const clearFilters = () => {
    onFilterChange({ search: '', status: '', severity: '' });
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search incidents..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="w-[160px]">
        <Select
          placeholder="All statuses"
          options={statusOptions}
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
        />
      </div>
      <div className="w-[160px]">
        <Select
          placeholder="All severities"
          options={severityOptions}
          value={filters.severity}
          onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
