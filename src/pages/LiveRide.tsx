import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Phone, MessageCircle, Car, Navigation } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { DriverStatusBadge } from '@/components/ui/driver-status-badge';
import { WaitTimer } from '@/components/ui/wait-timer';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { useActiveRide } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';

export default function LiveRide() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { data: activeRide, isLoading } = useActiveRide();

  // Mock ETA for demo
  const [eta, setEta] = useState(8);

  useEffect(() => {
    if (!isLoading && !activeRide) {
      navigate('/home');
    }
  }, [activeRide, isLoading, navigate]);

  // Simulate ETA countdown when driver is enroute
  useEffect(() => {
    if (activeRide?.status === 'enroute' && eta > 0) {
      const timer = setInterval(() => {
        setEta((prev) => Math.max(0, prev - 1));
      }, 30000); // Decrease every 30 seconds for demo

      return () => clearInterval(timer);
    }
  }, [activeRide?.status, eta]);

  if (isLoading) {
    return (
      <>
        <Header title="Corrida ao vivo" showBack />
        <PageContainer noPadding>
          <div className="h-64 bg-muted animate-shimmer" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!activeRide) {
    return null;
  }

  const pickupDate = new Date(activeRide.pickupTime);
  const showWaitTimer = activeRide.status === 'arrived' && activeRide.startedAt;

  const getStatusMessage = () => {
    switch (activeRide.status) {
      case 'enroute':
        return `Seu motorista está a caminho${eta > 0 ? ` • ${eta} min` : ''}`;
      case 'arrived':
        return 'Seu motorista chegou!';
      case 'in_progress':
        return 'Viagem em andamento';
      default:
        return 'Acompanhe sua corrida';
    }
  };

  return (
    <>
      <Header title="Corrida ao vivo" showBack onBack={() => navigate('/home')} />
      <PageContainer noPadding>
        <div className="space-y-4 animate-fade-in">
          {/* Map placeholder with animated car */}
          <div className="h-64 bg-gradient-to-b from-secondary to-muted relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                    activeRide.status === 'enroute'
                      ? 'bg-status-enroute/20 animate-pulse-slow'
                      : activeRide.status === 'arrived'
                      ? 'bg-status-arrived/20 animate-bounce-subtle'
                      : 'bg-status-in-progress/20'
                  }`}
                >
                  {activeRide.status === 'enroute' ? (
                    <Navigation className="w-10 h-10 text-status-enroute" />
                  ) : activeRide.status === 'arrived' ? (
                    <MapPin className="w-10 h-10 text-status-arrived" />
                  ) : (
                    <Car className="w-10 h-10 text-status-in-progress" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Mapa em tempo real (MVP)
                </p>
              </div>
            </div>

            {/* Status pill overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <DriverStatusBadge status={activeRide.status} eta={activeRide.status === 'enroute' ? eta : undefined} />
            </div>
          </div>

          {/* Info Cards */}
          <div className="px-4 space-y-4">
            {/* Wait Timer - shown when driver arrived */}
            {showWaitTimer && (
              <WaitTimer startedAt={activeRide.startedAt!} />
            )}

            {/* Driver Card */}
            {activeRide.driverName && (
              <div className="premium-card p-4 animate-slide-up">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <Car className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{activeRide.driverName}</p>
                    <p className="text-sm text-muted-foreground">
                      {activeRide.vehicle} • {activeRide.plate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {activeRide.driverPhone && (
                    <a
                      href={`tel:${activeRide.driverPhone}`}
                      className="flex-1"
                    >
                      <Button variant="secondary" className="w-full h-12 hover-scale">
                        <Phone className="w-5 h-5 mr-2" />
                        Ligar
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="secondary"
                    className="flex-1 h-12 hover-scale"
                    onClick={() => setChatOpen(true)}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>
            )}

            {/* Route Card */}
            <div className="premium-card p-4 space-y-4 animate-slide-up delay-100">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Previsto às {format(pickupDate, 'HH:mm')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-3 h-3 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Origem</p>
                    <p className="text-sm">{activeRide.pickupAddress}</p>
                  </div>
                </div>
                <div className="ml-1.5 border-l-2 border-dashed border-border h-4" />
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-3 h-3 rounded-full bg-status-completed" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Destino</p>
                    <p className="text-sm">{activeRide.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div>
                  <span className="text-muted-foreground text-sm">Valor estimado</span>
                  {activeRide.waitingValue && activeRide.waitingValue > 0 && (
                    <p className="text-xs text-[hsl(var(--waiting))]">
                      + R$ {activeRide.waitingValue.toFixed(2)} espera
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold text-primary">
                  R$ {(activeRide.estimatedValue + (activeRide.waitingValue || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* View Details Button */}
            <Button
              variant="outline"
              className="w-full h-12 animate-slide-up delay-200"
              onClick={() => navigate(`/bookings/${activeRide.id}`)}
            >
              Ver detalhes completos
            </Button>
          </div>
        </div>
      </PageContainer>

      <ChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        bookingId={activeRide.id}
        driverName={activeRide.driverName}
      />
    </>
  );
}
