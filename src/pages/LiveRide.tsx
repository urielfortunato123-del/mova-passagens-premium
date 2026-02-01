import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Phone, MessageCircle, Car, Navigation, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { DriverStatusBadge } from '@/components/ui/driver-status-badge';
import { WaitTimer } from '@/components/ui/wait-timer';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { LiveRideMap } from '@/components/map/LiveRideMap';
import { useActiveRide } from '@/hooks/useBookings';
import { useMultipleGeocodes } from '@/hooks/useGeocode';
import { Skeleton } from '@/components/ui/skeleton';

// Fallback positions if geocoding fails - São Paulo area
const FALLBACK_POSITIONS = {
  pickup: { lat: -23.5505, lng: -46.6333 },
  dropoff: { lat: -23.5629, lng: -46.6544 },
};

export default function LiveRide() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { data: activeRide, isLoading } = useActiveRide();

  // Mock ETA for demo
  const [eta, setEta] = useState(8);
  
  // Real geocoding from addresses - always call hook with stable values
  const pickupAddress = activeRide?.pickupAddress || '';
  const dropoffAddress = activeRide?.dropoffAddress || '';
  
  const { results: geocodedPositions, isLoading: isGeocoding } = useMultipleGeocodes({
    pickup: pickupAddress,
    dropoff: dropoffAddress,
  });

  // Use geocoded positions or fallback
  const pickupPosition = useMemo(() => 
    geocodedPositions.pickup || FALLBACK_POSITIONS.pickup,
    [geocodedPositions.pickup]
  );
  
  const dropoffPosition = useMemo(() => 
    geocodedPositions.dropoff || FALLBACK_POSITIONS.dropoff,
    [geocodedPositions.dropoff]
  );

  // Driver position - starts offset from pickup and moves towards it/dropoff
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize driver position when pickup is geocoded
  useEffect(() => {
    if (pickupPosition && !driverPosition) {
      // Start driver position offset from pickup
      setDriverPosition({
        lat: pickupPosition.lat + 0.01, // ~1km offset
        lng: pickupPosition.lng + 0.008,
      });
    }
  }, [pickupPosition, driverPosition]);

  // Redirect to home if no active ride (after all hooks are called)
  useEffect(() => {
    if (!isLoading && !activeRide) {
      navigate('/home');
    }
  }, [activeRide, isLoading, navigate]);

  // Simulate ETA countdown and driver movement when enroute
  useEffect(() => {
    if (activeRide?.status === 'enroute' && eta > 0 && pickupPosition) {
      const timer = setInterval(() => {
        setEta((prev) => Math.max(0, prev - 1));
        
        // Move driver towards pickup
        setDriverPosition((prev) => {
          if (!prev) return prev;
          return {
            lat: prev.lat + (pickupPosition.lat - prev.lat) * 0.1,
            lng: prev.lng + (pickupPosition.lng - prev.lng) * 0.1,
          };
        });
      }, 3000);

      return () => clearInterval(timer);
    }
  }, [activeRide?.status, eta, pickupPosition]);

  // Simulate driver movement during ride
  useEffect(() => {
    if (activeRide?.status === 'in_progress' && dropoffPosition) {
      const timer = setInterval(() => {
        setDriverPosition((prev) => {
          if (!prev) return prev;
          return {
            lat: prev.lat + (dropoffPosition.lat - prev.lat) * 0.05,
            lng: prev.lng + (dropoffPosition.lng - prev.lng) * 0.05,
          };
        });
      }, 2000);

      return () => clearInterval(timer);
    }
  }, [activeRide?.status, dropoffPosition]);

  // Loading state
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

  // No active ride - will redirect via useEffect
  if (!activeRide) {
    return (
      <>
        <Header title="Corrida ao vivo" showBack />
        <PageContainer noPadding>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Nenhuma corrida ativa</p>
          </div>
        </PageContainer>
      </>
    );
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
          {/* Real Map with Leaflet */}
          <div className="h-72 relative overflow-hidden">
            {isGeocoding ? (
              <div className="h-full flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : driverPosition ? (
              <LiveRideMap
                driverPosition={driverPosition}
                pickupPosition={pickupPosition}
                dropoffPosition={dropoffPosition}
                status={activeRide.status}
                driverName={activeRide.driverName}
                pickupAddress={activeRide.pickupAddress}
                dropoffAddress={activeRide.dropoffAddress}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Carregando mapa...</p>
              </div>
            )}
            
            {/* Status pill overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
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
