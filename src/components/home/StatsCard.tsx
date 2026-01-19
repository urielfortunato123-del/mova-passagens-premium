import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        'premium-card p-4 flex flex-col gap-2 hover-scale cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs mb-1',
              trend === 'up' && 'text-status-confirmed',
              trend === 'down' && 'text-status-cancelled',
              trend === 'neutral' && 'text-muted-foreground'
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
    </div>
  );
}
