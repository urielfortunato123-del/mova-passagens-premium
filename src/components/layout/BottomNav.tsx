import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Map, CreditCard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

const navItems = [
  { path: '/home', label: 'Início', icon: Home },
  { path: '/bookings', label: 'Corridas', icon: Calendar },
  { path: '/map', label: 'Mapa', icon: Map },
  { path: '/payments', label: 'Pagamentos', icon: CreditCard },
  { path: '/profile', label: 'Perfil', icon: User },
];

// Trigger haptic feedback if supported
const triggerHaptic = (duration: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tappedItem, setTappedItem] = useState<string | null>(null);

  const handleNavClick = useCallback((path: string) => {
    triggerHaptic(15);
    setTappedItem(path);
    navigate(path);
    // Reset tapped state after animation
    setTimeout(() => setTappedItem(null), 300);
  }, [navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav">
      <div className="flex items-center justify-around h-16 pt-1 px-2 max-w-lg mx-auto mb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/bookings' && location.pathname.startsWith('/bookings/'));
          const Icon = item.icon;
          const isTapped = tappedItem === item.path;

          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              whileTap={{ scale: 0.85 }}
              className={cn(
                'nav-item rounded-xl transition-colors duration-200 min-w-[64px] relative',
                isActive && 'nav-item-active'
              )}
            >
              {/* iOS-style background pill for active state */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ 
                      type: 'spring' as const, 
                      stiffness: 500, 
                      damping: 30 
                    }}
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                  />
                )}
              </AnimatePresence>

              {/* Icon with iOS bounce animation */}
              <motion.div
                animate={isTapped ? {
                  scale: [1, 0.7, 1.2, 1],
                  y: [0, 2, -4, 0]
                } : {
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0
                }}
                transition={isTapped ? {
                  duration: 0.4,
                  times: [0, 0.2, 0.6, 1],
                  ease: 'easeOut'
                } : {
                  type: 'spring' as const,
                  stiffness: 400,
                  damping: 17
                }}
              >
                <Icon
                  className={cn(
                    'w-6 h-6',
                    isActive && 'text-primary'
                  )}
                />
              </motion.div>

              {/* Label with fade animation */}
              <motion.span 
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  y: isActive ? 0 : 1
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'text-[10px] font-medium',
                  isActive && 'text-primary'
                )}
              >
                {item.label}
              </motion.span>

              {/* Active indicator dot */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                      type: 'spring' as const, 
                      stiffness: 500, 
                      damping: 25,
                      delay: 0.1
                    }}
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
