import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Booking } from '@/types';
import { StatusChip } from '@/components/ui/status-chip';

interface RecentRidesProps {
  bookings: Booking[];
}

export function RecentRides({ bookings }: RecentRidesProps) {
  const navigate = useNavigate();

  if (bookings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Corridas recentes
        </h3>
        <button
          onClick={() => navigate('/bookings')}
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          Ver todas
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {bookings.map((booking, index) => (
          <button
            key={booking.id}
            onClick={() => navigate(`/bookings/${booking.id}`)}
            className="w-full premium-card p-3 text-left flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {booking.dropoffAddress}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(booking.pickupTime), "dd MMM, HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <StatusChip status={booking.status} size="sm" />
              <span className="text-xs font-medium text-primary">
                R$ {(booking.finalValue || booking.estimatedValue).toFixed(2)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
