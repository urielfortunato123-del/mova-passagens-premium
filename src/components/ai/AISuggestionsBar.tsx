import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Gift, Phone, CreditCard, MapPin, Calendar } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car,
  gift: Gift,
  phone: Phone,
  'credit-card': CreditCard,
  map: MapPin,
  calendar: Calendar,
};

interface AISuggestionsBarProps {
  className?: string;
}

export function AISuggestionsBar({ className }: AISuggestionsBarProps) {
  const navigate = useNavigate();
  const { suggestions, fetchSuggestions } = useAIAssistant();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (suggestions.length === 0) return null;

  return (
    <div className={cn('flex gap-2 overflow-x-auto no-scrollbar py-2', className)}>
      {suggestions.map((suggestion, index) => {
        const Icon = iconMap[suggestion.icon] || Gift;
        return (
          <button
            key={index}
            onClick={() => {
              if (suggestion.action === 'navigate') {
                navigate(suggestion.target);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap text-sm font-medium"
          >
            <Icon className="w-4 h-4" />
            {suggestion.text}
          </button>
        );
      })}
    </div>
  );
}
