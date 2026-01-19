import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Phone, MessageCircle, Car, Navigation } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { useActiveRide } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';

export default function LiveRide() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { data: activeRide, isLoading } = useActiveRide();

  // Simulated driver position for MVP
  const [driverPosition] = useState({ lat: -23.5505, lng: -46.6333 });

  useEffect(() => {
    if (!isLoading && !activeRide) {
      navigate('/home');
    }
  }, [activeRide, isLoading, navigate]);

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

  const getStatusMessage = () => {
    switch (activeRide.status) {
      case 'enroute':
        return 'Seu motorista está a caminho';
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
          {/* Map placeholder */}
          <div className="h-64 bg-gradient-to-b from-secondary to-muted relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse-slow">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Mapa em tempo real (MVP)
                </p>
              </div>
            </div>
            
            {/* Status pill overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="px-4 py-2 rounded-full glass">
                <p className="text-sm font-medium">{getStatusMessage()}</p>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="px-4 space-y-4">
            {/* Driver Card */}
            {activeRide.driverName && (
              <div className="premium-card p-4">
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
                  <StatusChip status={activeRide.status} />
                </div>

                <div className="flex gap-2 mt-4">
                  {activeRide.driverPhone && (
                    <a
                      href={`tel:${activeRide.driverPhone}`}
                      className="flex-1"
                    >
                      <Button variant="secondary" className="w-full h-12">
                        <Phone className="w-5 h-5 mr-2" />
                        Ligar
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="secondary"
                    className="flex-1 h-12"
                    onClick={() => setChatOpen(true)}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>
            )}

            {/* Route Card */}
            <div className="premium-card p-4 space-y-4">
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
                <span className="text-muted-foreground">Valor estimado</span>
                <span className="text-xl font-bold text-primary">
                  R$ {activeRide.estimatedValue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* View Details Button */}
            <Button
              variant="outline"
              className="w-full h-12"
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
