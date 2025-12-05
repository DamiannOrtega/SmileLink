import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapComponentProps {
    center: { lat: number; lng: number };
    zoom?: number;
    height?: string;
    selectedLocation?: { lat: number; lng: number } | null;
    onLocationSelect?: (location: { lat: number; lng: number }) => void;
    interactive?: boolean;
}

export default function LeafletMapComponent({
    center,
    zoom = 13,
    height = "400px",
    selectedLocation,
    onLocationSelect,
    interactive = true,
}: LeafletMapComponentProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize map
        if (!mapRef.current) {
            mapRef.current = L.map(containerRef.current).setView(
                [center.lat, center.lng],
                zoom
            );

            // Add OpenStreetMap tiles
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(mapRef.current);

            // Add click handler if interactive
            if (interactive && onLocationSelect) {
                mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
                    const { lat, lng } = e.latlng;
                    onLocationSelect({ lat, lng });
                });
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update marker when selectedLocation changes
    useEffect(() => {
        if (!mapRef.current) return;

        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }

        // Add new marker if location is selected
        if (selectedLocation) {
            markerRef.current = L.marker([
                selectedLocation.lat,
                selectedLocation.lng,
            ]).addTo(mapRef.current);

            // Center map on marker
            mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], zoom);
        }
    }, [selectedLocation, zoom]);

    // Update center when prop changes
    useEffect(() => {
        if (mapRef.current && !selectedLocation) {
            mapRef.current.setView([center.lat, center.lng], zoom);
        }
    }, [center.lat, center.lng, zoom, selectedLocation]);

    return (
        <div
            ref={containerRef}
            style={{ height, width: "100%" }}
            className="rounded-md border overflow-hidden"
        />
    );
}
