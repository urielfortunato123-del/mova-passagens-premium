import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, Check, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAddressHistory } from '@/hooks/useAddressHistory';

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

interface HistoryItem {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
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
  onAddressSelected?: (address: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
  saveToHistory?: boolean;
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

// Extract house number from user input (e.g., "Rua X 447" or "Rua X, 447")
function extractHouseNumber(input: string): string | null {
  // Match patterns like "447", ", 447", " 447" at end or middle of string
  const match = input.match(/[,\s]+(\d+[A-Za-z]?)(?:\s*[-,]|$|\s+\w)/);
  if (match) return match[1];
  
  // Match number at end of string
  const endMatch = input.match(/\s+(\d+[A-Za-z]?)$/);
  if (endMatch) return endMatch[1];
  
  return null;
}

function formatAddress(result: NominatimResult, userInput?: string): string {
  const { address } = result;
  const parts: string[] = [];
  
  // Get house number from API or extract from user input
  const apiHouseNumber = address.house_number;
  const userHouseNumber = userInput ? extractHouseNumber(userInput) : null;
  const houseNumber = apiHouseNumber || userHouseNumber;

  if (address.road) {
    if (houseNumber) {
      parts.push(`${address.road}, ${houseNumber}`);
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
  onAddressSelected,
  placeholder = 'Digite o endereço',
  className,
  disabled,
  showValidation = true,
  saveToHistory = true,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [historyResults, setHistoryResults] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const { history, searchHistory, addToHistory } = useAddressHistory();

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
    // First, show history results immediately
    const historyMatches = searchHistory(query);
    setHistoryResults(historyMatches);
    
    if (query.length < 3) {
      setResults([]);
      setIsOpen(historyMatches.length > 0);
      return;
    }

    setIsLoading(true);
    const searchResults = await searchAddresses(query);
    setResults(searchResults);
    setIsOpen(searchResults.length > 0 || historyMatches.length > 0);
    setHighlightedIndex(-1);
    setIsLoading(false);
  }, [searchHistory]);

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
    // Pass user input to preserve house number if API didn't return it
    const formatted = formatAddress(result, inputValue);
    const coords = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    
    setSelectedAddress(formatted);
    setIsValidSelection(true);
    onValidChange?.(true);
    setInputValue(formatted);
    onChange(formatted, coords);
    onAddressSelected?.(formatted, coords);
    setInputValue(formatted);
    onChange(formatted, coords);
    onAddressSelected?.(formatted, coords);
    
    // Save to history
    if (saveToHistory) {
      addToHistory.mutate({ address: formatted, lat: coords.lat, lng: coords.lng });
    }
    
    setIsOpen(false);
    setResults([]);
    setHistoryResults([]);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    const coords = item.lat && item.lng ? { lat: item.lat, lng: item.lng } : undefined;
    
    setSelectedAddress(item.address);
    setIsValidSelection(true);
    onValidChange?.(true);
    setInputValue(item.address);
    onChange(item.address, coords);
    onAddressSelected?.(item.address, coords);
    
    // Update history usage
    if (saveToHistory) {
      addToHistory.mutate({ address: item.address, lat: item.lat ?? undefined, lng: item.lng ?? undefined });
    }
    
    setIsOpen(false);
    setResults([]);
    setHistoryResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = historyResults.length + results.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < historyResults.length) {
            handleHistorySelect(historyResults[highlightedIndex]);
          } else {
            const resultIndex = highlightedIndex - historyResults.length;
            if (results[resultIndex]) {
              handleSelect(results[resultIndex]);
            }
          }
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
    setHistoryResults([]);
    setIsOpen(false);
    setIsValidSelection(false);
    setSelectedAddress(null);
    onValidChange?.(false);
    inputRef.current?.focus();
  };

  // Show history on focus if empty
  const handleFocus = () => {
    if (!inputValue && history.length > 0) {
      setHistoryResults(history.slice(0, 5));
      setIsOpen(true);
    } else if (results.length > 0 || historyResults.length > 0) {
      setIsOpen(true);
    }
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
          onFocus={handleFocus}
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

      {isOpen && (historyResults.length > 0 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-scale-in">
          <ul className="py-1 max-h-60 overflow-auto">
            {/* History results */}
            {historyResults.length > 0 && (
              <>
                <li className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
                  Recentes
                </li>
                {historyResults.map((item, index) => (
                  <li key={`history-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => handleHistorySelect(item)}
                      className={cn(
                        'w-full px-3 py-2.5 text-left flex items-start gap-3 transition-colors',
                        index === highlightedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      <History className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <span className="text-sm leading-tight line-clamp-2">
                        {item.address}
                      </span>
                    </button>
                  </li>
                ))}
              </>
            )}
            
            {/* Nominatim results */}
            {results.length > 0 && (
              <>
                {historyResults.length > 0 && (
                  <li className="px-3 py-1.5 text-xs text-muted-foreground font-medium border-t border-border mt-1 pt-2">
                    Sugestões
                  </li>
                )}
                {results.map((result, index) => (
                  <li key={result.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(result)}
                      className={cn(
                        'w-full px-3 py-2.5 text-left flex items-start gap-3 transition-colors',
                        (index + historyResults.length) === highlightedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-sm leading-tight">
                        {formatAddress(result, inputValue)}
                      </span>
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
