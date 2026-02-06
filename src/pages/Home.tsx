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

          {/* MOVA+ Card */}
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' as const, stiffness: 260, damping: 20 }}
            whileHover={{ 
              y: -4, 
              scale: 1.02,
              boxShadow: '0 0 30px hsl(152 75% 45% / 0.3)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/benefits')}
            className="w-full premium-card p-4 text-left bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      '0 0 10px hsl(152 75% 45% / 0.2)',
                      '0 0 25px hsl(152 75% 45% / 0.4)',
                      '0 0 10px hsl(152 75% 45% / 0.2)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <span className="text-2xl">{currentTier.icon}</span>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">MOVA+</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nível {currentTier.name} • +{currentTier.cashbackPercent}% cashback
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </motion.div>
            </div>
          </motion.button>

          {/* Stats Cards - Animated Grid */}
          <StatsGrid stats={statsData} />

          {/* Active Ride Banner */}
          {activeRide && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: [
                  '0 0 0 0 hsl(152 75% 45% / 0)',
                  '0 0 0 8px hsl(152 75% 45% / 0.2)',
                  '0 0 0 0 hsl(152 75% 45% / 0)'
                ]
              }}
              transition={{ 
                duration: 0.4,
                boxShadow: { duration: 2, repeat: Infinity }
              }}
              onClick={() => navigate('/live')}
              className="w-full premium-card p-4 text-left ring-2 ring-primary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    <Car className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <p className="font-semibold">Corrida em andamento</p>
                    <p className="text-sm text-muted-foreground">
                      {activeRide.driverName || 'Motorista a caminho'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </motion.button>
          )}

          {/* Main Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring' as const, stiffness: 260, damping: 20 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => navigate('/schedule')}
                className="w-full h-14 text-base font-semibold"
                variant="premium"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Zap className="w-5 h-5 mr-2" />
                </motion.div>
                Pedir MOVA
              </Button>
            </motion.div>
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
              <Button onClick={() => navigate('/schedule')}>
                <Zap className="w-4 h-4 mr-2" />
                Pedir agora
              </Button>
            </motion.div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
