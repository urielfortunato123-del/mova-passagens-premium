import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  highlight?: boolean;
  accentColor?: 'primary' | 'accent' | 'muted';
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isHighlight = stat.highlight;
        const accentColor = stat.accentColor || 'primary';
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: index * 0.1,
              duration: 0.4,
              type: 'spring' as const,
              stiffness: 260,
              damping: 20
            }}
            whileHover={{ 
              y: -4, 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'premium-card p-4 flex flex-col cursor-pointer',
              isHighlight && 'border-l-4 border-l-accent'
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-sm text-muted-foreground">{stat.title}</span>
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1 + 0.2,
                  type: 'spring' as const,
                  stiffness: 300,
                  damping: 15
                }}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  accentColor === 'primary' && 'bg-primary/10',
                  accentColor === 'accent' && 'bg-accent/10',
                  accentColor === 'muted' && 'bg-secondary'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5',
                  accentColor === 'primary' && 'text-primary',
                  accentColor === 'accent' && 'text-accent',
                  accentColor === 'muted' && 'text-muted-foreground'
                )} />
              </motion.div>
            </div>
            <motion.span 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.1 + 0.3,
                type: 'spring' as const,
                stiffness: 400,
                damping: 20
              }}
              className={cn(
                'text-3xl font-bold mt-2',
                isHighlight && 'text-accent'
              )}
            >
              {stat.value}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
