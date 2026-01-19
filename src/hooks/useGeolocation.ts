import { useState, useCallback } from 'react';
import { reverseGeocode } from './useGeocode';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  position: GeolocationPosition | null;
  address: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    position: null,
    address: null,
  });

  const getCurrentLocation = useCallback(async (): Promise<{
    address: string;
    coords: { lat: number; lng: number };
  } | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não suportada neste navegador',
        loading: false,
      }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache for 1 minute
        });
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Reverse geocode to get address
      const address = await reverseGeocode(coords.lat, coords.lng);

      setState({
        loading: false,
        error: null,
        position,
        address,
      });

      return { address, coords };
    } catch (error) {
      let errorMessage = 'Erro ao obter localização';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao obter localização';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      return null;
    }
  }, []);

  return {
    ...state,
    getCurrentLocation,
  };
}
