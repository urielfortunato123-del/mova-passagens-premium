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
        'min-h-screen pb-24', // Fixed padding for bottom nav (96px)
        !noPadding && 'px-4 py-4',
        className
      )}
    >
      <div className="max-w-lg mx-auto pb-safe">
        {children}
      </div>
    </main>
  );
}
