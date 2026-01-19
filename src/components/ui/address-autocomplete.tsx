import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface AddressValue {
  address: string;
  coords?: { lat: number; lng: number };
  isValid: boolean;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  onValidChange?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

// Rate limiting: max 1 request per second for Nominatim
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

async function searchAddresses(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return [];

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'br', // Focus on Brazil
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'Accept-Language': 'pt-BR',
        },
      }
    );

    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}

function formatAddress(result: NominatimResult): string {
  const { address } = result;
  const parts: string[] = [];

  if (address.road) {
    if (address.house_number) {
      parts.push(`${address.road}, ${address.house_number}`);
    } else {
      parts.push(address.road);
    }
  }

  if (address.suburb) parts.push(address.suburb);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);

  return parts.length > 0 ? parts.join(' - ') : result.display_name;
}

export function AddressAutocomplete({
  value,
  onChange,
  onValidChange,
  placeholder = 'Digite o endereço',
  className,
  disabled,
  showValidation = true,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync external value and check if it matches a selected address
  useEffect(() => {
    setInputValue(value);
    // If value was set externally (e.g., from favorites), mark as valid
    if (value && value === selectedAddress) {
      setIsValidSelection(true);
    } else if (value && selectedAddress && value !== selectedAddress) {
      // Value was modified after selection
      setIsValidSelection(false);
      onValidChange?.(false);
    }
  }, [value, selectedAddress, onValidChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const searchResults = await searchAddresses(query);
    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
    setHighlightedIndex(-1);
    setIsLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    // Mark as invalid when typing (user modified the selected address)
    if (isValidSelection && newValue !== selectedAddress) {
      setIsValidSelection(false);
      onValidChange?.(false);
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(newValue);
    }, 300);
  };

  const handleSelect = (result: NominatimResult) => {
    const formatted = formatAddress(result);
    setSelectedAddress(formatted);
    setIsValidSelection(true);
    onValidChange?.(true);
    setInputValue(formatted);
    onChange(formatted, {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setIsOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setResults([]);
    setIsOpen(false);
    setIsValidSelection(false);
    setSelectedAddress(null);
    onValidChange?.(false);
    inputRef.current?.focus();
  };

  // Allow setting as valid externally (for favorites)
  const markAsValid = useCallback((address: string) => {
    setSelectedAddress(address);
    setIsValidSelection(true);
    onValidChange?.(true);
  }, [onValidChange]);

  // Expose markAsValid through a ref-like pattern
  useEffect(() => {
    if (value && !selectedAddress && value.length > 10) {
      // If value is set externally with a reasonable address, assume it's valid (e.g., from favorites)
      setSelectedAddress(value);
      setIsValidSelection(true);
      onValidChange?.(true);
    }
  }, [value, selectedAddress, onValidChange]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'h-12 pr-16',
            showValidation && inputValue && !isValidSelection && 'border-destructive focus-visible:ring-destructive',
            showValidation && isValidSelection && 'border-status-completed focus-visible:ring-status-completed',
            className
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {showValidation && isValidSelection && !isLoading && (
            <Check className="w-4 h-4 text-status-completed" />
          )}
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      
      {showValidation && inputValue && !isValidSelection && !isOpen && (
        <p className="text-xs text-destructive mt-1">
          Selecione um endereço da lista de sugestões
        </p>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-scale-in">
          <ul className="py-1 max-h-60 overflow-auto">
            {results.map((result, index) => (
              <li key={result.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full px-3 py-2.5 text-left flex items-start gap-3 transition-colors',
                    index === highlightedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span className="text-sm leading-tight">
                    {formatAddress(result)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
