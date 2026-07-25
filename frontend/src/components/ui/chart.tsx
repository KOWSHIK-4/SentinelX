import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
};

export const chartColorArray = Object.values(chartColors);

interface ChartContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({ children, className }: ChartContainerProps) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; fill?: string }[];
  label?: string;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      {label && <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const color = entry.color || entry.fill || chartColors.blue;
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChartLegendProps {
  payload?: { value: string; color?: string; fill?: string }[];
}

export function ChartLegend({ payload }: ChartLegendProps) {
  if (!payload || payload.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 mt-4 justify-center">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill || chartColors.blue }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <motion.div
        className="w-full px-8"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
      >
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <path
            d="M0 180 Q50 160 100 140 T200 100 T300 80 T400 60"
            fill="none"
            stroke="currentColor"
            className="text-muted-foreground/20"
            strokeWidth="2"
          />
          <path
            d="M0 180 Q50 160 100 140 T200 100 T300 80 T400 60"
            fill="none"
            stroke="currentColor"
            className="text-muted-foreground/10"
            strokeWidth="2"
            strokeDasharray="8 4"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1s" repeatCount="indefinite" />
          </path>
          {[0, 100, 200, 300, 400].map((x) => (
            <circle key={x} cx={x} cy={180 - x * 0.3} r="4" className="fill-muted-foreground/20" />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}