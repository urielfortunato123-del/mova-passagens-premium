import { useState, useEffect } from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitTimerProps {
  startedAt: string;
  ratePerMinute?: number;
  maxMinutes?: number;
  className?: string;
}

export function WaitTimer({
  startedAt,
  ratePerMinute = 0.25,
  maxMinutes = 15,
  className,
}: WaitTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      setElapsedSeconds(Math.max(0, diff));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const waitingValue = Math.min(minutes, maxMinutes) * ratePerMinute;
  const isOverLimit = minutes >= maxMinutes;

  return (
    <div
      className={cn(
        'premium-card p-4 space-y-3 animate-timer-pulse',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--waiting)/0.2)] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[hsl(var(--waiting))]" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tempo de espera</p>
            <p className="text-2xl font-bold tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-[hsl(var(--waiting))]">
            <DollarSign className="w-4 h-4" />
            <span className="text-xl font-bold">
              R$ {waitingValue.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            R$ {ratePerMinute.toFixed(2)}/min
          </p>
        </div>
      </div>

      {isOverLimit && (
        <div className="text-xs text-status-cancelled bg-status-cancelled/10 rounded-lg px-3 py-2 text-center">
          Limite de {maxMinutes} minutos atingido
        </div>
      )}

      {!isOverLimit && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--waiting))] transition-all duration-1000"
            style={{ width: `${Math.min((minutes / maxMinutes) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
