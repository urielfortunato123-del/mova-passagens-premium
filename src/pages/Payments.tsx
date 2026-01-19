import { useState } from 'react';
import { CreditCard, Wallet, QrCode, Check, Plus, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { usePaymentMethods, useAddPaymentMethod, useSetDefaultPayment, useDeletePaymentMethod } from '@/hooks/usePayments';
import { PaymentType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const paymentIcons: Record<PaymentType, typeof CreditCard> = {
  pix: QrCode,
  card: CreditCard,
  wallet: Wallet,
};

const paymentLabels: Record<PaymentType, string> = {
  pix: 'PIX',
  card: 'Cartão',
  wallet: 'Carteira digital',
};

export default function Payments() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<PaymentType>('pix');
  const { data: payments = [], isLoading } = usePaymentMethods();
  const addPayment = useAddPaymentMethod();
  const setDefault = useSetDefaultPayment();
  const deletePayment = useDeletePaymentMethod();

  const handleAddPayment = async () => {
    await addPayment.mutateAsync({
      type: newPaymentType,
      isDefault: payments.length === 0,
    });
    setAddDialogOpen(false);
  };

  return (
    <>
      <Header title="Pagamentos" />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Add Payment Button */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-14">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar método de pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo método de pagamento</DialogTitle>
                <DialogDescription>
                  Escolha o tipo de pagamento que deseja adicionar
                </DialogDescription>
              </DialogHeader>

              <RadioGroup
                value={newPaymentType}
                onValueChange={(v) => setNewPaymentType(v as PaymentType)}
                className="space-y-3 py-4"
              >
                {(['pix', 'card', 'wallet'] as PaymentType[]).map((type) => {
                  const Icon = paymentIcons[type];
                  return (
                    <div
                      key={type}
                      className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => setNewPaymentType(type)}
                    >
                      <RadioGroupItem value={type} id={type} />
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <Label htmlFor={type} className="flex-1 cursor-pointer">
                        {paymentLabels[type]}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              <DialogFooter>
                <Button onClick={handleAddPayment} disabled={addPayment.isPending}>
                  {addPayment.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Payment Methods List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Métodos salvos
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Nenhum método de pagamento cadastrado
                </p>
              </div>
            ) : (
              payments.map((payment) => {
                const Icon = paymentIcons[payment.type];
                return (
                  <div
                    key={payment.id}
                    className={cn(
                      'premium-card p-4 flex items-center gap-4',
                      payment.isDefault && 'ring-1 ring-primary'
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{paymentLabels[payment.type]}</p>
                      {payment.last4 && (
                        <p className="text-sm text-muted-foreground">
                          •••• {payment.last4}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.isDefault ? (
                        <span className="text-xs text-primary font-medium px-2 py-1 rounded-full bg-primary/10">
                          Padrão
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefault.mutate(payment.id)}
                          disabled={setDefault.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Definir
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deletePayment.mutate(payment.id)}
                        disabled={deletePayment.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Receipts placeholder */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Recibos recentes
            </h3>
            <div className="text-center py-6 premium-card">
              <p className="text-sm text-muted-foreground">
                Os recibos das suas corridas aparecerão aqui
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
