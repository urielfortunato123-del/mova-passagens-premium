import { Gift, Star, ChevronRight, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { membershipTiers } from '@/data/benefits';
import { useBookings } from '@/hooks/useBookings';

export default function Benefits() {
  const navigate = useNavigate();
  const { data: completedBookings = [] } = useBookings(['completed']);
  
  const monthlyRides = completedBookings.filter(b => {
    const now = new Date();
    const bookingDate = new Date(b.completedAt || b.pickupTime);
    return bookingDate.getMonth() === now.getMonth() && 
           bookingDate.getFullYear() === now.getFullYear();
  }).length;

  // Determine current tier
  const currentTier = [...membershipTiers]
    .reverse()
    .find(tier => monthlyRides >= tier.minRides) || membershipTiers[0];
  
  const currentTierIndex = membershipTiers.findIndex(t => t.level === currentTier.level);
  const nextTier = membershipTiers[currentTierIndex + 1];
  
  const progressToNext = nextTier 
    ? ((monthlyRides - currentTier.minRides) / (nextTier.minRides - currentTier.minRides)) * 100
    : 100;

  const ridesToNext = nextTier ? nextTier.minRides - monthlyRides : 0;

  // Calculate estimated cashback
  const totalSpent = completedBookings.reduce((acc, b) => acc + (b.finalValue || b.estimatedValue), 0);
  const estimatedCashback = totalSpent * (currentTier.cashbackPercent / 100);

  return (
    <>
      <Header title="MOVA+" showBack />
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Current Level Card */}
          <div className="premium-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Sparkles className="w-full h-full text-primary" />
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{currentTier.icon}</div>
              <div>
                <p className="text-sm text-muted-foreground">Seu nível</p>
                <h2 className="text-2xl font-bold">{currentTier.name}</h2>
                <p className="text-sm text-primary font-medium">
                  +{currentTier.cashbackPercent}% cashback
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{monthlyRides} corridas este mês</span>
                {nextTier && (
                  <span className="text-primary font-medium">
                    {ridesToNext} para {nextTier.name}
                  </span>
                )}
              </div>
              <Progress value={Math.min(progressToNext, 100)} className="h-2" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="premium-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Cashback Acumulado</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                R$ {estimatedCashback.toFixed(2)}
              </p>
            </div>
            <div className="premium-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Corridas Total</span>
              </div>
              <p className="text-2xl font-bold">{completedBookings.length}</p>
            </div>
          </div>

          {/* Current Benefits */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Seus Benefícios
            </h3>
            <div className="premium-card divide-y divide-border">
              {currentTier.benefits.map((benefit, index) => (
                <div key={index} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold">Explore Mais</h3>
            
            <button
              onClick={() => navigate('/partners')}
              className="w-full premium-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white">
                  🛍️
                </div>
                <div className="text-left">
                  <p className="font-medium">Parceiros</p>
                  <p className="text-sm text-muted-foreground">Descontos exclusivos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate('/telephony')}
              className="w-full premium-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                  📱
                </div>
                <div className="text-left">
                  <p className="font-medium">Telefonia & Internet</p>
                  <p className="text-sm text-muted-foreground">TIM, Claro, Vivo</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => navigate('/bradesco')}
              className="w-full premium-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs">
                  B
                </div>
                <div className="text-left">
                  <p className="font-medium">Parceria Bradesco</p>
                  <p className="text-sm text-muted-foreground">KM e benefícios bancários</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* All Levels */}
          <div className="space-y-3">
            <h3 className="font-semibold">Todos os Níveis</h3>
            <div className="grid gap-3">
              {membershipTiers.map((tier, index) => {
                const isCurrentTier = tier.level === currentTier.level;
                const isUnlocked = monthlyRides >= tier.minRides;
                
                return (
                  <div
                    key={tier.level}
                    className={`premium-card p-4 ${isCurrentTier ? 'ring-2 ring-primary' : ''} ${!isUnlocked ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tier.icon}</span>
                        <div>
                          <p className="font-medium">{tier.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tier.minRides}+ corridas/mês
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">+{tier.cashbackPercent}%</p>
                        <p className="text-xs text-muted-foreground">cashback</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
