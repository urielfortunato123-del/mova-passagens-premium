import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Phone, MessageCircle, Car, Info, X, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { Timeline } from '@/components/ui/timeline';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { useBooking, useCancelBooking } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { data: booking, isLoading } = useBooking(id || '');
  const cancelBooking = useCancelBooking();

  if (isLoading) {
    return (
      <>
        <Header title="Detalhes" showBack />
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-60 rounded-2xl" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Header title="Detalhes" showBack />
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Agendamento não encontrado</p>
            <Button onClick={() => navigate('/bookings')} className="mt-4">
              Voltar aos agendamentos
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const pickupDate = new Date(booking.pickupTime);
  const canCancel = ['requested', 'confirmed'].includes(booking.status);
  const hasDriver = !!booking.driverName;
  const isActive = ['enroute', 'arrived', 'in_progress'].includes(booking.status);

  const handleCancel = async () => {
    await cancelBooking.mutateAsync({ id: booking.id });
    navigate('/bookings');
  };

  return (
    <>
      <Header title="Detalhes da corrida" showBack />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Status & Date */}
          <div className="flex items-center justify-between">
            <StatusChip status={booking.status} />
            <span className="text-sm text-muted-foreground">
              {format(pickupDate, "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>

          {/* Route Card */}
          <div className="premium-card p-4 space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="w-5 h-5 text-primary" />
              {format(pickupDate, 'HH:mm')}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-3 h-3 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="text-sm">{booking.pickupAddress}</p>
                </div>
              </div>
              <div className="ml-1.5 border-l-2 border-dashed border-border h-4" />
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-3 h-3 rounded-full bg-status-completed" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="text-sm">{booking.dropoffAddress}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-muted-foreground">
                {booking.finalValue ? 'Valor final' : 'Valor estimado'}
              </span>
              <span className="text-xl font-bold text-primary">
                R$ {(booking.finalValue || booking.estimatedValue).toFixed(2)}
              </span>
            </div>

            {/* Waiting info */}
            {booking.waitingTime && booking.waitingTime > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tempo de espera: {booking.waitingTime} min</span>
                <span>+ R$ {(booking.waitingValue || 0).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Driver Info */}
          {hasDriver && (
            <div className="premium-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                  <Car className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{booking.driverName}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicle} • {booking.plate}
                  </p>
                </div>
                {booking.driverPhone && (
                  <a
                    href={`tel:${booking.driverPhone}`}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="premium-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Status da corrida
            </h3>
            <Timeline currentStatus={booking.status} />
          </div>

          {/* Waiting info notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Tempo de espera: R$0,25/min após 15 minutos de tolerância gratuita.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isActive && (
              <>
                <Button
                  variant="secondary"
                  className="flex-1 h-12"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat
                </Button>
                <Button
                  className="flex-1 h-12"
                  onClick={() => navigate('/live')}
                >
                  Acompanhar
                </Button>
              </>
            )}

            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full h-12"
                    disabled={cancelBooking.isPending}
                  >
                    {cancelBooking.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <X className="w-5 h-5 mr-2" />
                        Cancelar corrida
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar corrida?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar esta corrida? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>
                      Confirmar cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </PageContainer>

      <ChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        bookingId={booking.id}
        driverName={booking.driverName}
      />
    </>
  );
}
