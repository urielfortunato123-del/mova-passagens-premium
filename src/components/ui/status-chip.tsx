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
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn('status-chip', config.className, className)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
