import { useState, useEffect, useCallback } from 'react';

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

// Cache to avoid redundant API calls
const geocodeCache = new Map<string, GeocodingResult>();

// Rate limiting: Nominatim requires max 1 request per second
let lastRequestTime = 0;

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  // Check cache first
  const cached = geocodeCache.get(address.toLowerCase());
  if (cached) {
    return cached;
  }

  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'br', // Limit to Brazil
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'MOVA-Passageiro/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data: NominatimResponse[] = await response.json();

    if (data.length === 0) {
      return null;
    }

    const result: GeocodingResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };

    // Cache the result
    geocodeCache.set(address.toLowerCase(), result);

    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          'User-Agent': 'MOVA-Passageiro/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

interface UseGeocodeOptions {
  address: string;
  enabled?: boolean;
}

export function useGeocode({ address, enabled = true }: UseGeocodeOptions) {
  const [result, setResult] = useState<GeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !address || address.length < 5) {
      setResult(null);
      return;
    }

    let cancelled = false;

    const fetchGeocode = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const geocoded = await geocodeAddress(address);
        if (!cancelled) {
          setResult(geocoded);
          if (!geocoded) {
            setError('Endereço não encontrado');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Erro ao buscar coordenadas');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    // Debounce the geocoding request
    const timeoutId = setTimeout(fetchGeocode, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [address, enabled]);

  return { result, isLoading, error };
}

// Hook to geocode multiple addresses at once
export function useMultipleGeocodes(addresses: { pickup: string; dropoff: string }) {
  const [results, setResults] = useState<{
    pickup: GeocodingResult | null;
    dropoff: GeocodingResult | null;
  }>({ pickup: null, dropoff: null });
  const [isLoading, setIsLoading] = useState(false);

  const geocodeAll = useCallback(async () => {
    if (!addresses.pickup && !addresses.dropoff) return;

    setIsLoading(true);

    try {
      const [pickupResult, dropoffResult] = await Promise.all([
        addresses.pickup ? geocodeAddress(addresses.pickup) : null,
        addresses.dropoff ? geocodeAddress(addresses.dropoff) : null,
      ]);

      setResults({
        pickup: pickupResult,
        dropoff: dropoffResult,
      });
    } catch (error) {
      console.error('Multiple geocode error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addresses.pickup, addresses.dropoff]);

  useEffect(() => {
    geocodeAll();
  }, [geocodeAll]);

  return { results, isLoading, refetch: geocodeAll };
}
