import { useState } from 'react';
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
import { BookingStatus } from '@/types';
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

  const upcomingBookings = bookings.filter((b) =>
    ['requested', 'confirmed', 'enroute', 'arrived', 'in_progress'].includes(b.status)
  );
  const pastBookings = bookings.filter((b) =>
    ['completed', 'cancelled'].includes(b.status)
  );

  return (
    <>
      <Header
        title="Meus agendamentos"
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
                <Skeleton key={i} className="h-40 rounded-2xl" />
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
              {/* Upcoming */}
              {upcomingBookings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Próximas corridas ({upcomingBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {upcomingBookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <BookingCard booking={booking} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past */}
              {pastBookings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Histórico ({pastBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {pastBookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="animate-fade-in opacity-75"
                        style={{ animationDelay: `${(upcomingBookings.length + index) * 100}ms` }}
                      >
                        <BookingCard booking={booking} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
