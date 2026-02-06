import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Info, Loader2, CreditCard, Banknote, QrCode, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentMethod } from './PaymentMethodSelect';

interface PricePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime?: Date;
  paymentMethod: PaymentMethod;
  payBeforeRide: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
  isInstant?: boolean;
}

const paymentLabels: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  credit_card: { label: 'Cartão de Crédito', icon: CreditCard },
  debit_card: { label: 'Cartão de Débito', icon: Wallet },
  cash: { label: 'Dinheiro', icon: Banknote },
  pix: { label: 'PIX', icon: QrCode },
};

// Pricing constants
const BASE_FARE = 5.00; // Tarifa base
const PRICE_PER_KM = 2.00; // R$2/km

// Estimate distance from addresses (mock - in production use geocoding API)
function estimateDistance(): number {
  // Returns a reasonable distance estimate (3-15km for urban rides)
  return 3 + Math.random() * 12;
}

// Calculate price based on distance
function estimatePrice(distanceKm: number): { price: number; distance: number } {
  const price = BASE_FARE + (distanceKm * PRICE_PER_KM);
  return {
    price: Math.round(price * 100) / 100,
    distance: Math.round(distanceKm * 10) / 10
  };
}

export function PricePreview({
  open,
  onOpenChange,
  pickupAddress,
  dropoffAddress,
  pickupTime,
  paymentMethod,
  payBeforeRide,
  onConfirm,
  isLoading,
  isInstant = false,
}: PricePreviewProps) {
  const estimatedDistance = estimateDistance();
  const { price: estimatedPrice, distance } = estimatePrice(estimatedDistance);
  const PaymentIcon = paymentLabels[paymentMethod].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>{isInstant ? 'Confirmar corrida' : 'Confirmar agendamento'}</DialogTitle>
          <DialogDescription>
            Revise os detalhes da sua corrida
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Route info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-3 h-3 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="text-sm">{pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-3 h-3 rounded-full bg-status-completed" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm">{dropoffAddress}</p>
              </div>
            </div>
          </div>

          {/* Time */}
          {pickupTime && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                {isInstant ? (
                  <>
                    <p className="text-sm font-medium text-primary">Agora</p>
                    <p className="text-xs text-muted-foreground">
                      Motorista a caminho em instantes
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {format(pickupTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {format(pickupTime, 'HH:mm')}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Distância estimada</span>
              <span className="text-sm font-medium">{distance} km</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Valor estimado</span>
                <p className="text-xs text-muted-foreground/70">R${BASE_FARE.toFixed(2)} + R${PRICE_PER_KM.toFixed(2)}/km</p>
              </div>
              <span className="text-2xl font-bold text-primary">
                R$ {estimatedPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
            <PaymentIcon className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{paymentLabels[paymentMethod].label}</p>
              <p className="text-xs text-muted-foreground">
                {payBeforeRide ? 'Pagamento antecipado' : 'Pagamento ao motorista'}
              </p>
            </div>
            {payBeforeRide && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                Pagar antes
              </span>
            )}
          </div>

          {/* Waiting info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Tempo de espera: R$0,25/min após 15 minutos de tolerância.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={onConfirm}
            className="w-full h-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isInstant ? 'Solicitando...' : 'Agendando...'}
              </>
            ) : (
              isInstant ? 'Pedir MOVA agora' : 'Confirmar agendamento'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
            disabled={isLoading}
          >
            Voltar e editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
