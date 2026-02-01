import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BookingStatus } from '@/types';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const driverIcon = createCustomIcon('hsl(199 89% 48%)', '🚗');
const pickupIcon = createCustomIcon('hsl(38 92% 50%)', '📍');
const dropoffIcon = createCustomIcon('hsl(142 76% 36%)', '🏁');

interface Position {
  lat: number;
  lng: number;
}

interface LiveRideMapProps {
  driverPosition: Position;
  pickupPosition: Position;
  dropoffPosition: Position;
  status: BookingStatus;
  driverName?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
}

// Component to animate map view
function MapUpdater({ center, zoom }: { center: Position; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 1 });
  }, [center.lat, center.lng, zoom, map]);
  
  return null;
}

// Component to fit bounds
function BoundsFitter({ positions }: { positions: Position[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);
  
  return null;
}

// Leaflet can render a blank map if the container size changes right after mount.
// This happens often in mobile layouts, animated containers, or when navigating tabs.
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

export function LiveRideMap({
  driverPosition,
  pickupPosition,
  dropoffPosition,
  status,
  driverName,
  pickupAddress,
  dropoffAddress,
}: LiveRideMapProps) {
  // Determine which positions to show based on status
  const showDriver = ['enroute', 'arrived', 'in_progress'].includes(status);
  const showPickup = ['enroute', 'arrived'].includes(status);
  const showDropoff = ['in_progress'].includes(status);

  // Route polyline
  const routePositions: [number, number][] = showDropoff
    ? [
        [driverPosition.lat, driverPosition.lng],
        [dropoffPosition.lat, dropoffPosition.lng],
      ]
    : showPickup
    ? [
        [driverPosition.lat, driverPosition.lng],
        [pickupPosition.lat, pickupPosition.lng],
      ]
    : [];

  // Positions for bounds
  const allPositions = [
    driverPosition,
    ...(showPickup ? [pickupPosition] : []),
    ...(showDropoff ? [dropoffPosition] : []),
  ];

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[driverPosition.lat, driverPosition.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <InvalidateSizeOnMount />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <BoundsFitter positions={allPositions} />

        {/* Driver marker */}
        {showDriver && (
          <Marker position={[driverPosition.lat, driverPosition.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <strong>{driverName || 'Motorista'}</strong>
                <br />
                <span className="text-xs text-muted-foreground">
                  {status === 'enroute' ? 'A caminho' : status === 'arrived' ? 'Chegou' : 'Em viagem'}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup marker */}
        {showPickup && (
          <Marker position={[pickupPosition.lat, pickupPosition.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-center">
                <strong>Embarque</strong>
                <br />
                <span className="text-xs text-muted-foreground">{pickupAddress}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {showDropoff && (
          <Marker position={[dropoffPosition.lat, dropoffPosition.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="text-center">
                <strong>Destino</strong>
                <br />
                <span className="text-xs text-muted-foreground">{dropoffAddress}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: 'hsl(38, 92%, 50%)',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
