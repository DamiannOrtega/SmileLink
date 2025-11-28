import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, User, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ubicacionesMock } from "@/services/mockData";
import GoogleMapComponent from "@/components/GoogleMapComponent";

export default function UbicacionDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const ubicacion = ubicacionesMock.find((u) => u.id === id);

  if (!ubicacion) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Ubicación no encontrada</p>
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
            <h1 className="text-3xl font-bold text-foreground">{ubicacion.nombre}</h1>
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
                <p className="text-lg">{ubicacion.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <Badge variant={ubicacion.activo ? "default" : "secondary"}>
                  {ubicacion.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacidad</p>
                <p className="text-lg">{ubicacion.capacidad} personas</p>
              </div>
              {ubicacion.notas && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notas</p>
                  <p className="text-sm">{ubicacion.notas}</p>
                </div>
              )}
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
                <p className="text-sm font-medium text-muted-foreground">Dirección Completa</p>
                <p>{ubicacion.direccion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ciudad</p>
                  <p>{ubicacion.ciudad}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <p>{ubicacion.estado}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código Postal</p>
                <p>{ubicacion.codigoPostal}</p>
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
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Persona de Contacto</p>
                <p>{ubicacion.contacto}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <a href={`tel:${ubicacion.telefono}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  {ubicacion.telefono}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <GoogleMapComponent
            lat={ubicacion.latitud}
            lng={ubicacion.longitud}
            title={ubicacion.nombre}
          />
        </div>
      </div>
    </div>
  );
}
