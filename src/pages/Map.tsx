import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, Car } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { useActiveRide } from '@/hooks/useBookings';
import { useGeolocation } from '@/hooks/useGeolocation';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom user location icon
const userLocationIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background: hsl(199 89% 48%);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 8px hsla(199, 89%, 48%, 0.2), 0 4px 12px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Invalidate map size on mount to fix blank map issue
function InvalidateSizeOnMount() {
  const map = useMap();

  useEffect(() => {
    const t = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);
    return () => window.clearTimeout(t);
  }, [map]);

  return null;
}

// Center map on position
function CenterOnPosition({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1 });
    }
  }, [position, map]);

  return null;
}

// Default position (São Paulo)
const DEFAULT_POSITION = { lat: -23.5505, lng: -46.6333 };

export default function Map() {
  const navigate = useNavigate();
  const { data: activeRide } = useActiveRide();
  const { position: geoPosition, loading: geoLoading, getCurrentLocation } = useGeolocation();
  
  const [mapCenter, setMapCenter] = useState(DEFAULT_POSITION);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Update user position when geolocation returns
  useEffect(() => {
    if (geoPosition) {
      const coords = {
        lat: geoPosition.coords.latitude,
        lng: geoPosition.coords.longitude,
      };
      setUserPosition(coords);
      setMapCenter(coords);
    }
  }, [geoPosition]);

  const handleCenterOnUser = async () => {
    if (userPosition) {
      setMapCenter(userPosition);
    } else {
      const result = await getCurrentLocation();
      if (result) {
        setUserPosition(result.coords);
        setMapCenter(result.coords);
      }
    }
  };

  return (
    <>
      <Header title="Mapa" />
      <PageContainer noPadding>
        <div className="h-[calc(100vh-8rem)] relative">
          {/* Map Container */}
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={14}
            scrollWheelZoom={true}
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
          >
            <InvalidateSizeOnMount />
            <CenterOnPosition position={mapCenter} />
            
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* User location marker */}
            {userPosition && (
              <Marker position={[userPosition.lat, userPosition.lng]} icon={userLocationIcon}>
                <Popup>
                  <div className="text-center">
                    <strong>Sua localização</strong>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Floating Controls */}
          <div className="absolute bottom-24 right-4 z-[1000] flex flex-col gap-2">
            {/* Center on user button */}
            <Button
              size="icon"
              variant="secondary"
              className="w-12 h-12 rounded-full shadow-lg"
              onClick={handleCenterOnUser}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Active Ride Banner */}
          {activeRide && (
            <button
              onClick={() => navigate('/live')}
              className="absolute top-4 left-4 right-4 z-[1000] premium-card p-3 text-left animate-pulse-slow ring-2 ring-primary"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Corrida em andamento</p>
                  <p className="text-xs text-muted-foreground">
                    Toque para acompanhar
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Request Ride Button */}
          <div className="absolute bottom-6 left-4 right-4 z-[1000]">
            <Button
              onClick={() => navigate('/schedule')}
              className="w-full h-12 text-base font-semibold shadow-lg"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Pedir MOVA
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
