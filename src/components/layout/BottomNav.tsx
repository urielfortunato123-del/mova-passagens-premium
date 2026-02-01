import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Map, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

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

  const handleNavClick = useCallback((path: string) => {
    triggerHaptic(15); // Short vibration for tactile feedback
    navigate(path);
  }, [navigate]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-nav">
      <div className="flex items-center justify-around h-14 pt-1 px-2 max-w-lg mx-auto mb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/bookings' && location.pathname.startsWith('/bookings/'));
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                'nav-item rounded-xl transition-all duration-200 min-w-[64px]',
                isActive && 'nav-item-active'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
