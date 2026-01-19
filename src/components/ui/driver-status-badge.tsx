import { cn } from '@/lib/utils';
import { Car, Navigation, MapPin, Clock } from 'lucide-react';
import { BookingStatus } from '@/types';

interface DriverStatusBadgeProps {
  status: BookingStatus;
  eta?: number; // minutes
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; icon: typeof Car; colorClass: string }
> = {
  confirmed: {
    label: 'Aguardando',
    icon: Clock,
    colorClass: 'bg-status-confirmed/20 text-status-confirmed',
  },
  enroute: {
    label: 'A caminho',
    icon: Navigation,
    colorClass: 'bg-status-enroute/20 text-status-enroute',
  },
  arrived: {
    label: 'Chegou',
    icon: MapPin,
    colorClass: 'bg-status-arrived/20 text-status-arrived',
  },
  in_progress: {
    label: 'Em viagem',
    icon: Car,
    colorClass: 'bg-status-in-progress/20 text-status-in-progress',
  },
};

export function DriverStatusBadge({ status, eta, className }: DriverStatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium',
        config.colorClass,
        status === 'enroute' && 'animate-pulse-slow',
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{config.label}</span>
      {status === 'enroute' && eta && (
        <span className="text-xs opacity-80">• {eta} min</span>
      )}
    </div>
  );
}
