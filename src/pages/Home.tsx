import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, ArrowRight, Star, Car, Bell, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { StatsCard } from '@/components/home/StatsCard';
import { RecentRides } from '@/components/home/RecentRides';
import { useAuth } from '@/contexts/AuthContext';
import { useNextBooking, useActiveRide, useBookings, useRecentBookings } from '@/hooks/useBookings';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';

export default function Home() {
  const navigate = useNavigate();
  const { passengerProfile } = useAuth();
  const { data: nextBooking } = useNextBooking();
  const { data: activeRide } = useActiveRide();
  const { data: favorites = [] } = useFavorites();
  const { data: recentBookings = [] } = useRecentBookings(3);
  const { data: allBookings = [] } = useBookings(['completed']);
  const { isGranted, requestPermission } = useNotifications();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Calculate stats
  const totalRides = allBookings.length;
  const totalSpent = allBookings.reduce(
    (acc, b) => acc + (b.finalValue || b.estimatedValue),
    0
  );

  return (
    <>
      <Header title="MOVA" />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Greeting + Notification Bell */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{greeting()},</p>
              <h2 className="text-2xl font-bold">
                {passengerProfile?.name?.split(' ')[0] || 'Passageiro'}
              </h2>
            </div>
            {!isGranted && (
              <button
                onClick={requestPermission}
                className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                title="Ativar notificações"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Active Ride Banner */}
          {activeRide && (
            <button
              onClick={() => navigate('/live')}
              className="w-full premium-card p-4 text-left animate-pulse-slow ring-2 ring-primary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-bounce-subtle">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Corrida em andamento</p>
                    <p className="text-sm text-muted-foreground">
                      {activeRide.driverName || 'Motorista a caminho'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </button>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => navigate('/schedule')}
              className="h-24 flex-col gap-2 hover-scale"
              size="lg"
            >
              <Calendar className="w-6 h-6" />
              <span>Agendar corrida</span>
            </Button>
            <Button
              onClick={() => navigate('/bookings')}
              variant="secondary"
              className="h-24 flex-col gap-2 hover-scale"
              size="lg"
            >
              <Clock className="w-6 h-6" />
              <span>Meus agendamentos</span>
            </Button>
          </div>

          {/* Stats Cards */}
          {totalRides > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                title="Corridas"
                value={totalRides}
                icon={Car}
              />
              <StatsCard
                title="Total gasto"
                value={`R$ ${totalSpent.toFixed(0)}`}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Next Booking */}
          {nextBooking && !activeRide && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Próxima corrida
              </h3>
              <button
                onClick={() => navigate(`/bookings/${nextBooking.id}`)}
                className="w-full premium-card p-4 text-left space-y-3 hover-scale"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(nextBooking.pickupTime), "dd MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <StatusChip status={nextBooking.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-primary" />
                    <p className="text-sm line-clamp-1">{nextBooking.pickupAddress}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-status-completed" />
                    <p className="text-sm line-clamp-1">{nextBooking.dropoffAddress}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    {nextBooking.driverName ? `${nextBooking.driverName} • ${nextBooking.plate}` : 'Aguardando motorista'}
                  </span>
                  <span className="font-semibold text-primary">
                    R$ {nextBooking.estimatedValue.toFixed(2)}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Recent Rides */}
          <RecentRides bookings={recentBookings} />

          {/* Favorites Quick Access */}
          {favorites.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Endereços favoritos
                </h3>
                <button
                  onClick={() => navigate('/favorites')}
                  className="text-xs text-primary font-medium"
                >
                  Ver todos
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                {favorites.slice(0, 4).map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => navigate('/schedule')}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors shrink-0 hover-scale"
                  >
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{fav.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state if no bookings */}
          {!nextBooking && !activeRide && recentBookings.length === 0 && (
            <div className="text-center py-8 space-y-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhuma corrida agendada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Agende sua primeira corrida e viaje com conforto
                </p>
              </div>
              <Button onClick={() => navigate('/schedule')}>
                Agendar agora
              </Button>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
