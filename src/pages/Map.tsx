import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, Car, Users, Clock, Filter } from 'lucide-react';
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

// Custom driver icon
const driverIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background: hsl(142 76% 36%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">
      🚗
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
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

// Driver type
interface Driver {
  id: number;
  name: string;
  vehicle: string;
  plate: string;
  eta: number;
  position: { lat: number; lng: number };
  direction: number; // angle in radians for movement direction
  speed: number; // movement speed multiplier
}

// Generate initial mock nearby drivers around a position
function generateInitialDrivers(center: { lat: number; lng: number }): Driver[] {
  const driversData = [
    { id: 1, name: 'Carlos Silva', vehicle: 'Toyota Corolla', plate: 'ABC-1234', eta: 3 },
    { id: 2, name: 'Ana Santos', vehicle: 'Honda Civic', plate: 'DEF-5678', eta: 5 },
    { id: 3, name: 'Roberto Lima', vehicle: 'Volkswagen Jetta', plate: 'GHI-9012', eta: 7 },
    { id: 4, name: 'Maria Oliveira', vehicle: 'Chevrolet Cruze', plate: 'JKL-3456', eta: 4 },
  ];

  return driversData.map((driver, index) => {
    // Generate random offset (roughly 500m-2km from center)
    const angle = (index * 90 + Math.random() * 45) * (Math.PI / 180);
    const distance = 0.005 + Math.random() * 0.015; // ~500m to 2km
    
    return {
      ...driver,
      position: {
        lat: center.lat + distance * Math.cos(angle),
        lng: center.lng + distance * Math.sin(angle),
      },
      direction: Math.random() * Math.PI * 2, // Random initial direction
      speed: 0.3 + Math.random() * 0.7, // Random speed factor
    };
  });
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

  // Nearby drivers state with animation
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [filterNearby, setFilterNearby] = useState(false);
  const centerRef = useRef(userPosition || DEFAULT_POSITION);

  // Filter drivers based on ETA
  const displayedDrivers = filterNearby 
    ? nearbyDrivers.filter(d => d.eta < 5) 
    : nearbyDrivers;

  // Initialize drivers when center changes
  useEffect(() => {
    const center = userPosition || DEFAULT_POSITION;
    centerRef.current = center;
    setNearbyDrivers(generateInitialDrivers(center));
  }, [userPosition]);

  // Animate driver movement
  useEffect(() => {
    const moveDrivers = () => {
      setNearbyDrivers(prevDrivers => 
        prevDrivers.map(driver => {
          // Small random movement
          const moveDistance = 0.00008 * driver.speed; // ~8 meters per tick
          
          // Occasionally change direction slightly
          let newDirection = driver.direction;
          if (Math.random() < 0.1) {
            newDirection += (Math.random() - 0.5) * Math.PI / 2;
          }

          // Calculate new position
          let newLat = driver.position.lat + moveDistance * Math.cos(newDirection);
          let newLng = driver.position.lng + moveDistance * Math.sin(newDirection);

          // Keep drivers within ~3km of center, bounce back if too far
          const center = centerRef.current;
          const distFromCenter = Math.sqrt(
            Math.pow(newLat - center.lat, 2) + 
            Math.pow(newLng - center.lng, 2)
          );

          if (distFromCenter > 0.025) {
            // Reverse direction towards center
            newDirection = Math.atan2(center.lng - newLng, center.lat - newLat);
          }

          // Update ETA based on distance (simplified)
          const etaMin = Math.max(1, Math.round(distFromCenter * 400));

          return {
            ...driver,
            position: { lat: newLat, lng: newLng },
            direction: newDirection,
            eta: Math.min(etaMin, 15),
          };
        })
      );
    };

    const intervalId = setInterval(moveDrivers, 2000); // Update every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

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

            {/* Nearby driver markers */}
            {displayedDrivers.map((driver) => (
              <Marker 
                key={driver.id} 
                position={[driver.position.lat, driver.position.lng]} 
                icon={driverIcon}
              >
                <Tooltip direction="top" offset={[0, -18]}>
                  <div className="text-center">
                    <strong>{driver.name}</strong>
                    <br />
                    <span className="text-xs">{driver.vehicle}</span>
                    <br />
                    <span className="text-xs text-green-600 font-semibold">
                      {driver.eta} min
                    </span>
                  </div>
                </Tooltip>
              </Marker>
            ))}

            {/* User location marker */}
            {userPosition && (
              <Marker position={[userPosition.lat, userPosition.lng]} icon={userLocationIcon}>
                <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                  Sua localização
                </Tooltip>
              </Marker>
            )}
          </MapContainer>

          {/* Driver count badge with filter */}
          <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            {!activeRide && (
              <>
                <div className="bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {displayedDrivers.length} motoristas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filterNearby ? 'a menos de 5 min' : 'disponíveis na região'}
                    </p>
                  </div>
                </div>
                
                {/* Filter toggle button */}
                <button
                  onClick={() => setFilterNearby(!filterNearby)}
                  className={`
                    bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border 
                    flex items-center gap-2 transition-all duration-200
                    ${filterNearby 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    filterNearby ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${filterNearby ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className={`text-sm font-medium ${filterNearby ? 'text-primary' : 'text-muted-foreground'}`}>
                    {filterNearby ? 'Próximos (< 5 min)' : 'Filtrar próximos'}
                  </span>
                </button>
              </>
            )}
          </div>

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
