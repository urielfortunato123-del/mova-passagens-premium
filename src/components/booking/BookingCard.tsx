import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
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
        'w-full text-left premium-card p-4 border-l-4 transition-all duration-200 hover:shadow-xl',
        isActive ? 'border-l-primary ring-1 ring-primary/30' : 'border-l-primary',
        isPast && 'opacity-75 border-l-muted-foreground',
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold text-lg">
              {format(pickupDate, 'HH:mm')}
            </span>
          </div>
          <StatusChip status={booking.status} />
        </div>
        <div className="flex items-center gap-1">
          <span className={cn(
            'font-bold text-lg',
            isPast ? 'text-muted-foreground' : 'text-primary'
          )}>
            R$ {(booking.finalValue || booking.estimatedValue).toFixed(2)}
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Addresses */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <p className="text-sm line-clamp-1">{booking.pickupAddress}</p>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <p className="text-sm line-clamp-1">{booking.dropoffAddress}</p>
        </div>
      </div>
    </button>
  );
}
