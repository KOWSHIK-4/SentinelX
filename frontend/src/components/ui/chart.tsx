import { cn } from '@/lib/utils';

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChartContainer({ className, children, ...props }: ChartContainerProps) {
  return (
    <div className={cn('w-full', className)} {...props}>
      {children}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; dataKey?: string }[];
  label?: string;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      {label && (
        <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const chartColors = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
  red: '#ef4444',
  amber: '#f59e0b',
  slate: '#64748b',
  emerald: '#10b981',
} as const;
