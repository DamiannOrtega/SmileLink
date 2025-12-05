import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApadrinamientosService,
  NinosService,
  PadrinosService,
  Apadrinamiento,
  Nino,
  Padrino
} from "@/services/api";
import { Pencil, ArrowLeft, User, Heart, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "0.5rem",
};

export default function AsignacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [asignacion, setAsignacion] = useState<Apadrinamiento | null>(null);
  const [nino, setNino] = useState<Nino | null>(null);
  const [padrino, setPadrino] = useState<Padrino | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBiJF9_m9VuwovcpOLUDBblpiOTg_DvS5E", // REPLACE WITH REAL KEY
  });

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (apadrinamientoId: string) => {
    try {
      setLoading(true);
      const data = await ApadrinamientosService.getById(apadrinamientoId);
      if (!data) {
        setAsignacion(null);
        return;
      }
      setAsignacion(data);

      // Fetch related entities
      if (data.id_nino) {
        const ninoData = await NinosService.getById(data.id_nino);
        setNino(ninoData);
      }
      if (data.id_padrino) {
        const padrinoData = await PadrinosService.getById(data.id_padrino);
        setPadrino(padrinoData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar la asignación");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!asignacion) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Asignación no encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mapCenter = {
    lat: asignacion.ubicacion_entrega_lat || 21.8853,
    lng: asignacion.ubicacion_entrega_lng || -102.2916,
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Detalle de Asignación</h1>
          <p className="text-muted-foreground">Información completa del apadrinamiento ({asignacion.id_apadrinamiento})</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/asignaciones")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate(`/asignaciones/${id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Niño
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">
                {nino ? nino.nombre : "Cargando..."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Edad</p>
                <p className="font-medium">{nino?.edad} años</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{nino?.genero}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/ninos/${nino?.id_nino}`)}
            >
              Ver perfil completo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Información del Padrino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">
                {padrino ? padrino.nombre : "Cargando..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{padrino?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/padrinos/${padrino?.id_padrino}`)}
            >
              Ver perfil completo
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalles de la Asignación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{asignacion.tipo_apadrinamiento}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge>{asignacion.estado_apadrinamiento_registro}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
              <p className="font-medium">
                {new Date(asignacion.fecha_inicio).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps Location Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {asignacion.direccion_entrega && (
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <p className="font-medium">{asignacion.direccion_entrega}</p>
            </div>
          )}

          {isLoaded && asignacion.ubicacion_entrega_lat && asignacion.ubicacion_entrega_lng ? (
            <div className="border rounded-md overflow-hidden">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={15}
              >
                <Marker position={mapCenter} />
              </GoogleMap>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-md text-center text-muted-foreground">
              {isLoaded ? "No hay ubicación de mapa registrada." : "Cargando mapa..."}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="destructive" onClick={() => toast.error("Función no implementada aún")}>
            Cancelar Asignación
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
