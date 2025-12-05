import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";

interface GoogleMapComponentProps {
  lat: number;
  lng: number;
  title: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

export default function GoogleMapComponent({ lat, lng, title }: GoogleMapComponentProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBiJF9_m9VuwovcpOLUDBblpiOTg_DvS5E", // API Key añadida
  });

  const center = {
    lat,
    lng,
  };

  if (loadError) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Para mostrar el mapa, necesitas agregar tu API Key de Google Maps
          </p>
          <a
            href="https://developers.google.com/maps/documentation/javascript/get-api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            Obtener API Key de Google Maps
          </a>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Ubicación:</p>
            <p className="text-sm text-muted-foreground">
              Latitud: {lat}, Longitud: {lng}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Ver en Google Maps
            </a>
          </div>
        </div>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={15} center={center}>
        <Marker position={center} title={title} />
      </GoogleMap>
    </Card>
  );
}
