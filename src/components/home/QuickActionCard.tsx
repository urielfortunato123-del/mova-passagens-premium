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
        type: 'spring' as const,
        stiffness: 300,
        damping: 20
      }}
      whileHover={{ 
        y: -4, 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(to)}
      className="premium-card p-3 flex flex-col items-center gap-2 text-center"
    >
      <motion.div 
        whileHover={{
          scale: 1.2,
          rotate: [0, -10, 10, 0],
          transition: { duration: 0.4 }
        }}
        className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-white`}
      >
        {icon}
      </motion.div>
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}
