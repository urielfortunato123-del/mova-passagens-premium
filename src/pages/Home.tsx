import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, ArrowRight, Car, DollarSign, TrendingUp, CheckCircle2, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { useAuth } from '@/contexts/AuthContext';
import { useNextBooking, useActiveRide, useBookings, useRecentBookings } from '@/hooks/useBookings';
import { membershipTiers } from '@/data/benefits';

export default function Home() {
  const navigate = useNavigate();
  const { passengerProfile } = useAuth();
  const { data: nextBooking } = useNextBooking();
  const { data: activeRide } = useActiveRide();
  const { data: recentBookings = [] } = useRecentBookings(3);
  const { data: allBookings = [] } = useBookings();
  const { data: completedBookings = [] } = useBookings(['completed']);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Olá,';
    if (hour < 18) return 'Olá,';
    return 'Olá,';
  };

  // Calculate stats
  const todayBookings = allBookings.filter(b => {
    const today = new Date();
    const bookingDate = new Date(b.pickupTime);
    return bookingDate.toDateString() === today.toDateString() && 
      ['requested', 'confirmed', 'enroute', 'arrived', 'in_progress'].includes(b.status);
  });

  const totalSpent = completedBookings.reduce(
    (acc, b) => acc + (b.finalValue || b.estimatedValue),
    0
  );

  const nextBookingTime = nextBooking ? format(new Date(nextBooking.pickupTime), 'HH:mm') : '--:--';

  // Calculate current tier for MOVA+
  const monthlyRides = completedBookings.filter(b => {
    const now = new Date();
    const bookingDate = new Date(b.completedAt || b.pickupTime);
    return bookingDate.getMonth() === now.getMonth() && 
           bookingDate.getFullYear() === now.getFullYear();
  }).length;

  const currentTier = [...membershipTiers]
    .reverse()
    .find(tier => monthlyRides >= tier.minRides) || membershipTiers[0];

  return (
    <>
      <Header title="MOVA" />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Greeting */}
          <div className="space-y-0">
            <p className="text-muted-foreground text-sm">{greeting()}</p>
            <h2 className="text-3xl font-bold">
              {passengerProfile?.name?.split(' ')[0] || 'Passageiro'}
            </h2>
          </div>

          {/* MOVA+ Card */}
          <button
            onClick={() => navigate('/benefits')}
            className="w-full premium-card p-4 text-left bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover-scale"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl">{currentTier.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">MOVA+</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nível {currentTier.name} • +{currentTier.cashbackPercent}% cashback
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
          </button>

          {/* Stats Cards - Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Corridas Hoje */}
            <div className="premium-card p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Corridas Hoje</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
              </div>
              <span className="text-3xl font-bold mt-2">{todayBookings.length}</span>
            </div>

            {/* Próxima às */}
            <div className="premium-card p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Próxima às</span>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <span className="text-3xl font-bold mt-2">{nextBookingTime}</span>
            </div>

            {/* Total Gasto */}
            <div className="premium-card p-4 flex flex-col border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Total Gasto</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
              <span className="text-2xl font-bold mt-2 text-primary">
                R$ {totalSpent.toFixed(0)}
              </span>
            </div>

            {/* Concluídas */}
            <div className="premium-card p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Concluídas</span>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <span className="text-3xl font-bold mt-2">{completedBookings.length}</span>
            </div>
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

          {/* Main Action Button */}
          <Button
            onClick={() => navigate('/bookings')}
            variant="secondary"
            className="w-full h-14 text-base font-semibold bg-[hsl(222,47%,11%)] dark:bg-[hsl(222,47%,16%)] text-white hover:bg-[hsl(222,47%,15%)] dark:hover:bg-[hsl(222,47%,20%)]"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Ver Corridas Agendadas
          </Button>

          {/* Next Booking */}
          {nextBooking && !activeRide && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Próxima Corrida</h3>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(nextBooking.pickupTime), 'HH:mm')}
                </span>
              </div>
              
              <button
                onClick={() => navigate(`/bookings/${nextBooking.id}`)}
                className="w-full premium-card p-4 text-left border-l-4 border-l-primary hover-scale"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-lg">
                      {format(new Date(nextBooking.pickupTime), 'HH:mm')}
                    </span>
                    <StatusChip status={nextBooking.status} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-lg text-primary">
                      R$ {nextBooking.estimatedValue.toFixed(2)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                    <p className="text-sm line-clamp-1">{nextBooking.pickupAddress}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-destructive" />
                    <p className="text-sm line-clamp-1">{nextBooking.dropoffAddress}</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Quick Access - Benefits */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              Benefícios Exclusivos
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/partners')}
                className="premium-card p-3 flex flex-col items-center gap-2 text-center hover-scale"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white">
                  🛍️
                </div>
                <span className="text-xs font-medium">Parceiros</span>
              </button>

              <button
                onClick={() => navigate('/telephony')}
                className="premium-card p-3 flex flex-col items-center gap-2 text-center hover-scale"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                  📱
                </div>
                <span className="text-xs font-medium">Telefonia</span>
              </button>

              <button
                onClick={() => navigate('/bradesco')}
                className="premium-card p-3 flex flex-col items-center gap-2 text-center hover-scale"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs">
                  B
                </div>
                <span className="text-xs font-medium">Bradesco</span>
              </button>
            </div>
          </div>

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
