import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '@/types';
import { StatusChip } from '@/components/ui/status-chip';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  className?: string;
}

export function BookingCard({ booking, className }: BookingCardProps) {
  const navigate = useNavigate();
  const pickupDate = new Date(booking.pickupTime);

  const isActive = ['enroute', 'arrived', 'in_progress'].includes(booking.status);
  const isPast = ['completed', 'cancelled'].includes(booking.status);

  return (
    <button
      onClick={() => navigate(`/bookings/${booking.id}`)}
      className={cn(
        'w-full text-left premium-card p-4 space-y-3 transition-all duration-200 hover:border-primary/50',
        isActive && 'ring-2 ring-primary/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-medium">
            {format(pickupDate, "dd MMM, HH:mm", { locale: ptBR })}
          </span>
        </div>
        <StatusChip status={booking.status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-1 w-2 h-2 rounded-full bg-primary" />
          <p className="text-sm flex-1 line-clamp-1">{booking.pickupAddress}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-1 w-2 h-2 rounded-full bg-status-completed" />
          <p className="text-sm flex-1 line-clamp-1">{booking.dropoffAddress}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm">
          {booking.driverName ? (
            <>
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {booking.driverName} • {booking.plate}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Aguardando motorista</span>
          )}
        </div>
        <span className={cn(
          'font-semibold',
          isPast ? 'text-muted-foreground' : 'text-primary'
        )}>
          R$ {(booking.finalValue || booking.estimatedValue).toFixed(2)}
        </span>
      </div>
    </button>
  );
}
