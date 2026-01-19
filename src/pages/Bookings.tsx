import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { BookingCard } from '@/components/booking/BookingCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBookings } from '@/hooks/useBookings';
import { BookingStatus, Booking } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: 'requested', label: 'Solicitado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'enroute', label: 'A caminho' },
  { value: 'arrived', label: 'Chegou' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
];

interface GroupedBookings {
  date: Date;
  bookings: Booking[];
}

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);
  const { data: bookings = [], isLoading } = useBookings(statusFilter.length > 0 ? statusFilter : undefined);

  const toggleStatus = (status: BookingStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    
    bookings.forEach((booking) => {
      const dateKey = format(new Date(booking.pickupTime), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(booking);
    });

    // Sort each group by time
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => 
        new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime()
      );
    });

    // Convert to array and sort by date (newest first for past, upcoming first for future)
    return Object.entries(groups)
      .map(([dateKey, bookings]) => ({
        date: new Date(dateKey),
        bookings,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [bookings]);

  const upcomingDays = groupedBookings.filter(group => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return group.date >= today && group.bookings.some(b => 
      !['completed', 'cancelled'].includes(b.status)
    );
  });

  const pastDays = groupedBookings.filter(group => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return group.date < today || group.bookings.every(b => 
      ['completed', 'cancelled'].includes(b.status)
    );
  }).reverse();

  const formatDateHeader = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Hoje';
    }
    
    return format(date, "EEEE, d 'De' MMMM", { locale: ptBR })
      .split(' ')
      .map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
      .join(' ');
  };

  return (
    <>
      <Header
        title="Corridas"
        rightContent={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Filter className="w-5 h-5" />
                {statusFilter.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                    {statusFilter.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter.includes(option.value)}
                  onCheckedChange={() => toggleStatus(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhum agendamento</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter.length > 0
                    ? 'Nenhum agendamento com os filtros selecionados'
                    : 'Você ainda não tem agendamentos'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Upcoming by Day */}
              {upcomingDays.map((group, groupIndex) => (
                <div key={group.date.toISOString()} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-2 py-2 border-b border-border">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="font-semibold">{formatDateHeader(group.date)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {group.bookings.length} corrida{group.bookings.length > 1 ? 's' : ''} agendada{group.bookings.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bookings */}
                  <div className="space-y-3">
                    {group.bookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${(groupIndex * 3 + index) * 50}ms` }}
                      >
                        <BookingCard booking={booking} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Past Rides */}
              {pastDays.length > 0 && upcomingDays.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Histórico</h3>
                </div>
              )}
              
              {pastDays.map((group, groupIndex) => (
                <div key={group.date.toISOString()} className="space-y-3 opacity-75">
                  {/* Date Header */}
                  <div className="flex items-center gap-2 py-2 border-b border-border">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="font-semibold">{formatDateHeader(group.date)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {group.bookings.length} corrida{group.bookings.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bookings */}
                  <div className="space-y-3">
                    {group.bookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${(upcomingDays.length * 3 + groupIndex * 3 + index) * 50}ms` }}
                      >
                        <BookingCard booking={booking} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
