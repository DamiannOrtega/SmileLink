import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, User, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PuntosEntregaService, PuntoEntrega } from "@/services/api";
import GoogleMapComponent from "@/components/GoogleMapComponent";

export default function UbicacionDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ubicacion, setUbicacion] = useState<PuntoEntrega | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUbicacion();
  }, [id]);

  const loadUbicacion = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await PuntosEntregaService.getById(id);
      setUbicacion(data);
    } catch (err) {
      toast.error("Error al cargar la ubicación");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-12 w-1/4" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!ubicacion) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Ubicación no encontrada</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate("/ubicaciones")}>Volver a la lista</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ubicaciones")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{ubicacion.nombre_punto}</h1>
            <p className="text-muted-foreground">Detalles del centro de acopio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/ubicaciones/${id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-lg">{ubicacion.nombre_punto}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <Badge variant={ubicacion.estado_punto === "Activo" ? "default" : "secondary"}>
                  {ubicacion.estado_punto}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Horario de Atención</p>
                <p className="text-base">{ubicacion.horario_atencion || "No especificado"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dirección Física</p>
                <p>{ubicacion.direccion_fisica}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coordenadas</p>
                <p className="text-sm">
                  Lat: {ubicacion.latitud}, Lng: {ubicacion.longitud}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${ubicacion.latitud},${ubicacion.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Ver en Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contacto de Referencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Persona de Contacto</p>
                <p>{ubicacion.contacto_referencia || "No especificado"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <GoogleMapComponent
            lat={Number(ubicacion.latitud)}
            lng={Number(ubicacion.longitud)}
            title={ubicacion.nombre_punto}
          />
        </div>
      </div>
    </div>
  );
}
