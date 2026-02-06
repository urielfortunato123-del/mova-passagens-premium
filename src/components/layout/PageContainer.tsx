import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({ children, className, noPadding = false }: PageContainerProps) {
  return (
    <main
      className={cn(
        'min-h-screen pb-24 relative', // Increased padding for glass nav
        !noPadding && 'px-4 py-4',
        className
      )}
    >
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="max-w-lg mx-auto pb-safe relative z-10">
        {children}
      </div>
    </main>
  );
}
