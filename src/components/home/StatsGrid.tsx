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
              type: 'spring',
              stiffness: 260,
              damping: 20
            }}
            whileHover={{ 
              y: -6, 
              scale: 1.03,
            }}
            whileTap={{ 
              scale: 0.95,
              y: 2
            }}
            className={cn(
              'rounded-2xl backdrop-blur-2xl bg-gradient-to-br from-card/60 to-card/40 border border-white/20 p-4 flex flex-col cursor-pointer relative overflow-hidden group',
              'shadow-[0_4px_20px_hsl(var(--foreground)/0.06),inset_0_1px_0_hsl(255_255%_255%/0.1)]',
              isHighlight && 'border-l-4 border-l-accent'
            )}
          >
            {/* Glass shimmer effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700"
            />
            
            <div className="flex items-start justify-between relative z-10">
              <span className="text-sm text-muted-foreground font-medium">{stat.title}</span>
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1 + 0.2,
                  type: 'spring',
                  stiffness: 300,
                  damping: 15
                }}
                whileHover={{ 
                  scale: 1.15,
                  rotate: [0, -10, 10, 0]
                }}
                className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/15',
                  accentColor === 'primary' && 'bg-primary/15',
                  accentColor === 'accent' && 'bg-accent/15',
                  accentColor === 'muted' && 'bg-secondary/50'
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
                type: 'spring',
                stiffness: 400,
                damping: 20
              }}
              className={cn(
                'text-3xl font-bold mt-3 relative z-10',
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
