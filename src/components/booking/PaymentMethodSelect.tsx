import { CreditCard, Banknote, QrCode, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/lib/api';

export type { PaymentMethod } from '@/lib/api';

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ElementType;
  payBefore: boolean; // Se paga antes de solicitar
}

const paymentOptions: PaymentOption[] = [
  {
    value: 'pix',
    label: 'PIX',
    description: 'Pague antes de solicitar',
    icon: QrCode,
    payBefore: true,
  },
  {
    value: 'credit_card',
    label: 'Crédito',
    description: 'Pague antes ou no app',
    icon: CreditCard,
    payBefore: false,
  },
  {
    value: 'debit_card',
    label: 'Débito',
    description: 'Pague no carro',
    icon: Wallet,
    payBefore: false,
  },
  {
    value: 'cash',
    label: 'Dinheiro',
    description: 'Pague no carro',
    icon: Banknote,
    payBefore: false,
  },
];

interface PaymentMethodSelectProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  payBeforeRide?: boolean;
  onPayBeforeChange?: (payBefore: boolean) => void;
}

export function PaymentMethodSelect({
  value,
  onChange,
  payBeforeRide = false,
  onPayBeforeChange,
}: PaymentMethodSelectProps) {
  const selectedOption = paymentOptions.find((opt) => opt.value === value);
  const showPayBeforeOption = value === 'credit_card';

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-2">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        Forma de pagamento
      </label>

      <div className="grid grid-cols-2 gap-2">
        {paymentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                // PIX sempre paga antes
                if (option.value === 'pix' && onPayBeforeChange) {
                  onPayBeforeChange(true);
                } else if (option.value !== 'credit_card' && onPayBeforeChange) {
                  onPayBeforeChange(false);
                }
              }}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}
              >
                {option.label}
              </span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Opção de pagar antes para crédito */}
      {showPayBeforeOption && onPayBeforeChange && value === 'credit_card' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <input
            type="checkbox"
            id="payBefore"
            checked={payBeforeRide}
            onChange={(e) => onPayBeforeChange(e.target.checked)}
            className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
          />
          <label htmlFor="payBefore" className="text-sm cursor-pointer">
            <span className="font-medium">Pagar agora</span>
            <span className="text-muted-foreground ml-1">
              (antes de solicitar a corrida)
            </span>
          </label>
        </div>
      )}

      {/* Info sobre pagamento */}
      {selectedOption && (
        <div
          className={cn(
            'p-3 rounded-lg text-sm',
            selectedOption.payBefore || (value === 'credit_card' && payBeforeRide)
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'bg-muted/50 text-muted-foreground'
          )}
        >
          {value === 'pix' && (
            <>
              <strong>PIX:</strong> Você pagará antes de solicitar. O QR Code será
              gerado após confirmar.
            </>
          )}
          {value === 'credit_card' && payBeforeRide && (
            <>
              <strong>Crédito antecipado:</strong> O valor será cobrado antes da
              corrida começar.
            </>
          )}
          {value === 'credit_card' && !payBeforeRide && (
            <>
              <strong>Crédito:</strong> O motorista passará a maquininha no
              final da corrida.
            </>
          )}
          {value === 'debit_card' && (
            <>
              <strong>Débito:</strong> O motorista passará a maquininha no carro.
            </>
          )}
          {value === 'cash' && (
            <>
              <strong>Dinheiro:</strong> Tenha o valor em mãos para pagar ao
              motorista.
            </>
          )}
        </div>
      )}
    </div>
  );
}
