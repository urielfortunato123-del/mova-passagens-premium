import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, Car, DollarSign, TrendingUp, Gift, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { useAuth } from '@/contexts/AuthContext';
import { useNextBooking, useActiveRide, useBookings, useRecentBookings } from '@/hooks/useBookings';
import { membershipTiers } from '@/data/benefits';
import { StatsGrid } from '@/components/home/StatsGrid';
import { QuickActionCard } from '@/components/home/QuickActionCard';

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
    if (hour < 12) return 'Bom dia,';
    if (hour < 18) return 'Boa tarde,';
    return 'Boa noite,';
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

  // Stats data for the grid
  const statsData = [
    { title: 'Corridas Hoje', value: todayBookings.length, icon: Calendar, accentColor: 'primary' as const },
    { title: 'Próxima às', value: nextBookingTime, icon: Clock, accentColor: 'muted' as const },
    { title: 'Total Gasto', value: `R$ ${totalSpent.toFixed(0)}`, icon: DollarSign, highlight: true, accentColor: 'accent' as const },
    { title: 'Concluídas', value: completedBookings.length, icon: TrendingUp, accentColor: 'muted' as const },
  ];

  // Quick actions data
  const quickActions = [
    { to: '/partners', icon: '🛍️', label: 'Parceiros', gradient: 'bg-gradient-to-br from-pink-500 to-orange-500' },
    { to: '/telephony', icon: '📱', label: 'Telefonia', gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { to: '/bradesco', icon: 'B', label: 'Bradesco', gradient: 'bg-gradient-to-br from-red-600 to-red-800', isBold: true },
  ];

  return (
    <>
      <Header title="MOVA" />
      <PageContainer>
        <div className="space-y-6">
          {/* Greeting */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-0"
          >
            <p className="text-muted-foreground text-sm">{greeting()}</p>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl font-bold"
            >
              {passengerProfile?.name?.split(' ')[0] || 'Passageiro'}
            </motion.h2>
          </motion.div>

          {/* MOVA+ Card - iOS 26 Liquid Glass Style */}
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ 
              y: -6, 
              scale: 1.02,
            }}
            whileTap={{ 
              scale: 0.95,
              y: 2
            }}
            onClick={() => navigate('/benefits')}
            className="w-full rounded-3xl backdrop-blur-2xl p-5 text-left bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-white/25 shadow-[0_8px_32px_hsl(var(--primary)/0.15),inset_0_1px_0_hsl(255_255%_255%/0.2)] relative overflow-hidden group"
          >
            {/* Glass shimmer effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
              animate={{ x: ['0%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      '0 0 15px hsl(152 75% 45% / 0.3)',
                      '0 0 30px hsl(152 75% 45% / 0.5)',
                      '0 0 15px hsl(152 75% 45% / 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-white/20 flex items-center justify-center"
                >
                  <span className="text-2xl">{currentTier.icon}</span>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-bold text-lg">MOVA+</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nível {currentTier.name} • +{currentTier.cashbackPercent}% cashback
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </motion.div>
            </div>
          </motion.button>

          {/* Stats Cards - Animated Grid */}
          <StatsGrid stats={statsData} />

          {/* Active Ride Banner - iOS 26 Style */}
          {activeRide && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => navigate('/live')}
              className="w-full rounded-2xl backdrop-blur-2xl p-4 text-left bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/50 shadow-[0_0_24px_hsl(var(--primary)/0.3)] relative overflow-hidden"
            >
              {/* Pulsing ring */}
              <motion.div 
                className="absolute inset-0 rounded-2xl border-2 border-primary/50"
                animate={{ 
                  scale: [1, 1.02, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <motion.div 
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-14 h-14 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-primary/40 to-primary/20 border border-white/20 flex items-center justify-center"
                  >
                    <Car className="w-7 h-7 text-primary" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg">Corrida em andamento</p>
                    <p className="text-sm text-muted-foreground">
                      {activeRide.driverName || 'Motorista a caminho'}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-10 h-10 rounded-full backdrop-blur-xl bg-primary/20 border border-white/20 flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5 text-primary" />
                </motion.div>
              </div>
            </motion.button>
          )}

          {/* Main Action Button - iOS 26 Liquid Glass Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <motion.button
              onClick={() => navigate('/schedule')}
              whileHover={{ 
                scale: 1.03, 
                y: -4,
              }}
              whileTap={{ 
                scale: 0.92,
                y: 2
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17
              }}
              className="w-full h-16 text-base font-semibold rounded-2xl backdrop-blur-2xl bg-gradient-to-r from-primary/90 via-primary to-primary-glow/90 text-primary-foreground border border-white/30 shadow-[0_8px_32px_hsl(var(--primary)/0.4),inset_0_2px_0_hsl(255_255%_255%/0.25),inset_0_-2px_8px_hsl(var(--primary)/0.3)] flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              {/* Glass shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={{ x: ['0%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              />
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
              >
                <Zap className="w-6 h-6" />
              </motion.div>
              <span className="relative z-10 text-lg">Pedir MOVA</span>
            </motion.button>
          </motion.div>

          {/* Next Booking */}
          {nextBooking && !activeRide && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: 'spring' as const, stiffness: 260, damping: 20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Próxima Corrida</h3>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(nextBooking.pickupTime), 'HH:mm')}
                </span>
              </div>
              
              <motion.button
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/bookings/${nextBooking.id}`)}
                className="w-full premium-card p-4 text-left border-l-4 border-l-primary"
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
              </motion.button>
            </motion.div>
          )}

          {/* Quick Access - Benefits */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              Benefícios Exclusivos
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={action.to}
                  to={action.to}
                  icon={action.isBold ? <span className="font-bold text-xs">{action.icon}</span> : action.icon}
                  label={action.label}
                  gradient={action.gradient}
                  index={index}
                />
              ))}
            </div>
          </motion.div>

          {/* Empty state if no bookings */}
          {!nextBooking && !activeRide && recentBookings.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' as const }}
              className="text-center py-8 space-y-4"
            >
              <motion.div 
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto"
              >
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </motion.div>
              <div>
                <p className="font-medium">Nenhuma corrida ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Peça sua primeira corrida e viaje com conforto
                </p>
              </div>
              <motion.button
                onClick={() => navigate('/schedule')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="h-12 px-6 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border border-white/25 shadow-[0_4px_16px_hsl(var(--primary)/0.3),inset_0_1px_0_hsl(255_255%_255%/0.2)] flex items-center justify-center gap-2 font-semibold"
              >
                <Zap className="w-4 h-4" />
                Pedir agora
              </motion.button>
            </motion.div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
