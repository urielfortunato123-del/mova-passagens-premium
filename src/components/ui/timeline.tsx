import { cn } from '@/lib/utils';
import { BookingStatus } from '@/types';
import { Check, Clock, Car, MapPin, Play, CheckCircle } from 'lucide-react';

const timelineSteps: { status: BookingStatus; label: string; icon: typeof Clock }[] = [
  { status: 'requested', label: 'Solicitado', icon: Clock },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle },
  { status: 'enroute', label: 'A caminho', icon: Car },
  { status: 'arrived', label: 'Chegou', icon: MapPin },
  { status: 'in_progress', label: 'Em andamento', icon: Play },
  { status: 'completed', label: 'Concluído', icon: Check },
];

const statusOrder: BookingStatus[] = [
  'requested',
  'confirmed',
  'enroute',
  'arrived',
  'in_progress',
  'completed',
];

interface TimelineProps {
  currentStatus: BookingStatus;
  className?: string;
}

export function Timeline({ currentStatus, className }: TimelineProps) {
  if (currentStatus === 'cancelled') {
    return (
      <div className={cn('text-center py-4', className)}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive">
          <span className="text-sm font-medium">Corrida cancelada</span>
        </div>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className={cn('space-y-2', className)}>
      {timelineSteps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.status} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary/20 text-primary ring-2 ring-primary animate-pulse-slow',
                  isPending && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              {index < timelineSteps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-6 my-1 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-6">
              <p
                className={cn(
                  'text-sm font-medium',
                  isCompleted && 'text-foreground',
                  isCurrent && 'text-primary',
                  isPending && 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
