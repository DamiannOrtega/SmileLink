import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = { lat: 21.8853, lng: -102.2916 };

const createLocationPinIcon = () =>
  L.divIcon({
    className: "smilelink-map-pin",
    html: `
      <div class="smilelink-map-pin__wrapper">
        <svg class="smilelink-map-pin__svg" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M20 0C10.059 0 2 8.059 2 18c0 12.25 18 34 18 34s18-21.75 18-34C38 8.059 29.941 0 20 0Z" fill="hsl(210 90% 48%)"/>
          <path d="M20 2C11.163 2 4 9.163 4 18c0 10.8 16 30.4 16 30.4S36 28.8 36 18C36 9.163 28.837 2 20 2Z" fill="hsl(210 90% 56%)"/>
          <circle cx="20" cy="18" r="7" fill="white" fill-opacity="0.98"/>
        </svg>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  });

interface LocationMapPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  readOnly?: boolean;
  height?: string;
}

function MapViewSync({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return null;
}

function MapInteractions({
  lat,
  lng,
  onLocationChange,
  readOnly,
  icon,
}: {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  readOnly?: boolean;
  icon: L.DivIcon;
}) {
  useMapEvents({
    click(event) {
      if (readOnly) return;
      onLocationChange(event.latlng.lat, event.latlng.lng);
    },
  });

  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      draggable={!readOnly}
      eventHandlers={
        readOnly
          ? undefined
          : {
              dragend: (event) => {
                const position = event.target.getLatLng();
                onLocationChange(position.lat, position.lng);
              },
            }
      }
    />
  );
}

export default function LocationMapPicker({
  lat,
  lng,
  onLocationChange,
  readOnly = false,
  height = "360px",
}: LocationMapPickerProps) {
  const pinIcon = useMemo(() => createLocationPinIcon(), []);
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const center = useMemo(() => {
    if (hasCoords) return { lat: lat!, lng: lng! };
    return DEFAULT_CENTER;
  }, [hasCoords, lat, lng]);

  return (
    <div className="space-y-2">
      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Haz clic en el mapa para marcar la ubicación o arrastra el pin. También puedes escribir latitud y longitud manualmente.
        </p>
      )}
      <div className="overflow-hidden rounded-lg border shadow-sm" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={hasCoords ? 15 : 12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewSync lat={hasCoords ? lat : null} lng={hasCoords ? lng : null} />
          <MapInteractions
            lat={hasCoords ? lat : null}
            lng={hasCoords ? lng : null}
            onLocationChange={onLocationChange}
            readOnly={readOnly}
            icon={pinIcon}
          />
        </MapContainer>
      </div>
    </div>
  );
}
