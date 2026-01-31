import { CreditCard, Gift, Shield, Wallet, TrendingUp, ChevronRight, Star, Zap } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/hooks/useBookings';

const bradescoFeatures = [
  {
    id: 'km',
    title: 'KM Bradesco',
    description: 'Ganhe 0,5 KM para cada R$ 1 gasto em corridas',
    icon: TrendingUp,
    highlight: '0,5 KM / R$1'
  },
  {
    id: 'parcelamento',
    title: 'Parcelamento',
    description: 'Parcele corridas em até 3x sem juros',
    icon: CreditCard,
    highlight: '3x sem juros'
  },
  {
    id: 'seguro',
    title: 'Seguro Viagem',
    description: 'Proteção automática em todas as corridas',
    icon: Shield,
    highlight: 'Gratuito'
  }
];

const redemptionOptions = [
  { id: '1', title: 'Desconto em corridas', description: 'Até 50% off', kmCost: 1000 },
  { id: '2', title: 'Cashback', description: 'Crédito na conta', kmCost: 2000 },
  { id: '3', title: 'Gift Cards', description: 'Parceiros selecionados', kmCost: 3000 },
  { id: '4', title: 'Milhas aéreas', description: 'Converter para Smiles', kmCost: 5000 }
];

const accountBenefits = [
  { title: 'Isenção de Tarifa', description: 'Conta digital sem mensalidade', icon: '🆓' },
  { title: 'PIX Premiado', description: 'Ganhe pontos a cada PIX', icon: '📲' },
  { title: 'Rendimento', description: 'Saldo rende mais que poupança', icon: '💰' }
];

export default function Bradesco() {
  const { toast } = useToast();
  const { data: completedBookings = [] } = useBookings(['completed']);

  // Calculate KM points
  const totalSpent = completedBookings.reduce((acc, b) => acc + (b.finalValue || b.estimatedValue), 0);
  const kmPoints = Math.floor(totalSpent * 0.5);

  const handleRedeem = (option: typeof redemptionOptions[0]) => {
    if (kmPoints < option.kmCost) {
      toast({
        variant: 'destructive',
        title: 'KMs insuficientes',
        description: `Você precisa de ${option.kmCost} KMs para este resgate.`,
      });
      return;
    }

    toast({
      title: 'Resgate solicitado!',
      description: `Seu resgate de "${option.title}" será processado em até 24h.`,
    });
  };

  const handleOpenAccount = () => {
    toast({
      title: 'Redirecionando...',
      description: 'Você será direcionado para abrir sua conta Bradesco.',
    });
  };

  return (
    <>
      <Header title="Parceria Bradesco" showBack />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Hero */}
          <div className="premium-card p-6 bg-gradient-to-br from-red-600 to-red-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
              <Star className="w-full h-full" />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl">
                B
              </div>
              <div>
                <p className="text-red-200 text-sm">Programa</p>
                <h2 className="text-xl font-bold">KM Bradesco</h2>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-red-200 text-sm">Seus KMs</span>
                <span className="text-3xl font-bold">{kmPoints.toLocaleString()}</span>
              </div>
              <Progress value={Math.min((kmPoints / 5000) * 100, 100)} className="h-2 bg-white/20" />
              <p className="text-xs text-red-200">
                {5000 - kmPoints > 0 ? `Faltam ${5000 - kmPoints} KMs para o próximo resgate` : 'Você pode fazer um resgate!'}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold">Benefícios do Cartão</h3>
            
            <div className="grid gap-3">
              {bradescoFeatures.map(feature => (
                <div key={feature.id} className="premium-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <Badge className="bg-red-600 hover:bg-red-700 shrink-0">
                    {feature.highlight}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Redemption Options */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              Resgate de KMs
            </h3>
            
            <div className="grid gap-3">
              {redemptionOptions.map(option => {
                const canRedeem = kmPoints >= option.kmCost;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleRedeem(option)}
                    className={`premium-card p-4 flex items-center justify-between text-left ${!canRedeem ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{option.title}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{option.kmCost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">KMs</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Benefits */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Conta Bradesco
            </h3>
            
            <div className="premium-card divide-y divide-border">
              {accountBenefits.map((benefit, index) => (
                <div key={index} className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{benefit.icon}</span>
                  <div>
                    <p className="font-medium">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleOpenAccount}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Abrir Conta Bradesco
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Info */}
          <div className="premium-card p-4 bg-red-600/5 border-red-600/20">
            <p className="text-sm text-center">
              🏦 <span className="font-medium">Já é cliente Bradesco?</span> Vincule seu cartão no app para acumular KMs automaticamente
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
