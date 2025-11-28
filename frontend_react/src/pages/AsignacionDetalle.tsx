import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  asignacionesMock,
  getNiñoById,
  getPadrinoById,
  getEventoById,
} from "@/services/mockData";
import { Pencil, ArrowLeft, User, Heart, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AsignacionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const asignacion = asignacionesMock.find((a) => a.id === id);

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

  const niño = getNiñoById(asignacion.niñoId);
  const padrino = getPadrinoById(asignacion.padrinoId);
  const evento = getEventoById(asignacion.eventoId);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Detalle de Asignación</h1>
          <p className="text-muted-foreground">Información completa del apadrinamiento</p>
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
                {niño?.nombre} {niño?.apellidos}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Edad</p>
                <p className="font-medium">{niño?.edad} años</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{niño?.genero}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Escuela</p>
              <p className="font-medium">{niño?.escuela}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/ninos/${niño?.id}`)}
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
                {padrino?.nombre} {padrino?.apellidos}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{padrino?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{padrino?.telefono}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Niños Apadrinados</p>
              <p className="font-medium">{padrino?.niñosApadrinados}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/padrinos/${padrino?.id}`)}
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
              <p className="text-sm text-muted-foreground">Evento</p>
              <p className="font-medium">{evento?.nombre || asignacion.eventoId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge>{asignacion.estado}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium">
                {new Date(asignacion.fechaCreacion).toLocaleDateString()}
              </p>
            </div>
          </div>

          {asignacion.notas && (
            <div>
              <p className="text-sm text-muted-foreground">Notas</p>
              <p className="font-medium">{asignacion.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {asignacion.estado === "Pendiente" && (
            <Button onClick={() => toast.success("Asignación aceptada")}>
              Marcar como Aceptado
            </Button>
          )}
          {asignacion.estado === "Aceptado" && (
            <Button onClick={() => toast.success("Entrega registrada")}>
              Registrar Entrega
            </Button>
          )}
          {asignacion.estado === "Entrega registrada" && (
            <Button onClick={() => toast.success("Entrega verificada")}>
              Verificar Entrega
            </Button>
          )}
          <Button variant="destructive" onClick={() => toast.error("Asignación cancelada")}>
            Cancelar Asignación
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
