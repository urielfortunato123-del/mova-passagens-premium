import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface QuickActionCardProps {
  to: string;
  icon: ReactNode;
  label: string;
  gradient: string;
  index: number;
}

export function QuickActionCard({ to, icon, label, gradient, index }: QuickActionCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.1 + 0.4,
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      whileHover={{ 
        y: -6, 
        scale: 1.08,
      }}
      whileTap={{ 
        scale: 0.88,
        y: 2
      }}
      onClick={() => navigate(to)}
      className="rounded-2xl backdrop-blur-2xl bg-gradient-to-br from-card/60 to-card/40 border border-white/20 p-4 flex flex-col items-center gap-3 text-center shadow-[0_4px_20px_hsl(var(--foreground)/0.06),inset_0_1px_0_hsl(255_255%_255%/0.1)] relative overflow-hidden group"
    >
      {/* Glass shimmer on hover */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700"
      />
      
      <motion.div 
        whileHover={{
          scale: 1.15,
          rotate: [0, -8, 8, 0],
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center text-white shadow-lg backdrop-blur-xl border border-white/20`}
      >
        {icon}
      </motion.div>
      <span className="text-xs font-semibold relative z-10">{label}</span>
    </motion.button>
  );
}
