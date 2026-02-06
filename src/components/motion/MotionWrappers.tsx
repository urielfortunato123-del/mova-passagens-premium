import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// Animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

// Motion components
interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
}

export function MotionCard({ children, delay = 0, className, ...props }: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
}

export function MotionButton({ children, className, ...props }: MotionButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: '0 0 30px hsl(152 75% 45% / 0.4)'
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

interface MotionContainerProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

export function MotionContainer({ children, className, ...props }: MotionContainerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionItemProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

export function MotionItem({ children, className, ...props }: MotionItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionFadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function MotionFadeIn({ children, delay = 0, className }: MotionFadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MotionSlideUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function MotionSlideUp({ children, delay = 0, className }: MotionSlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated icon wrapper with bounce
interface MotionIconProps {
  children: ReactNode;
  className?: string;
}

export function MotionIcon({ children, className }: MotionIconProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.2, 
        rotate: 5,
        transition: { type: 'spring', stiffness: 400 }
      }}
      whileTap={{ scale: 0.9 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Pulsing glow effect
interface MotionGlowProps {
  children: ReactNode;
  className?: string;
}

export function MotionGlow({ children, className }: MotionGlowProps) {
  return (
    <motion.div
      animate={{ 
        boxShadow: [
          '0 0 20px hsl(152 75% 45% / 0.2)',
          '0 0 40px hsl(152 75% 45% / 0.4)',
          '0 0 20px hsl(152 75% 45% / 0.2)'
        ]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
