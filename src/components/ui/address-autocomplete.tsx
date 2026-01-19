import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
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

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
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
  placeholder = 'Digite o endereço',
  className,
  disabled,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

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

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(newValue);
    }, 300);
  };

  const handleSelect = (result: NominatimResult) => {
    const formattedAddress = formatAddress(result);
    setInputValue(formattedAddress);
    onChange(formattedAddress, {
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
    inputRef.current?.focus();
  };

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
          className={cn('h-12 pr-10', className)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
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
