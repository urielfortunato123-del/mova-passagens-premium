import { cn } from '@/lib/utils';
import { BookingStatus } from '@/types';
import { Clock, CheckCircle, Car, MapPin, Play, Check, X } from 'lucide-react';

const statusConfig: Record<BookingStatus, { label: string; icon: typeof Clock; className: string }> = {
  requested: { label: 'Solicitado', icon: Clock, className: 'status-requested' },
  confirmed: { label: 'Confirmado', icon: CheckCircle, className: 'status-confirmed' },
  enroute: { label: 'A caminho', icon: Car, className: 'status-enroute' },
  arrived: { label: 'Chegou', icon: MapPin, className: 'status-arrived' },
  in_progress: { label: 'Em andamento', icon: Play, className: 'status-in-progress' },
  completed: { label: 'Concluído', icon: Check, className: 'status-completed' },
  cancelled: { label: 'Cancelado', icon: X, className: 'status-cancelled' },
};

interface StatusChipProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusChip({ status, size = 'md', className }: StatusChipProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'status-chip',
        config.className,
        size === 'sm' && 'text-[10px] px-2 py-0.5 gap-1',
        className
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', size === 'sm' && 'w-3 h-3')} />
      {config.label}
    </span>
  );
}
