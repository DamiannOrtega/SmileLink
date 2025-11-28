import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowLeft, Pencil } from "lucide-react";
import { getCartaById, getNiñoById, getEventoById } from "@/services/mockData";

const estadoColors = {
  "Pendiente": "bg-yellow-500/10 text-yellow-500",
  "Revisada": "bg-blue-500/10 text-blue-500",
  "Aprobada": "bg-green-500/10 text-green-500",
  "Rechazada": "bg-red-500/10 text-red-500",
};

export default function CartaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const carta = id ? getCartaById(id) : null;
  const niño = carta ? getNiñoById(carta.niñoId) : null;
  const evento = carta ? getEventoById(carta.eventoId) : null;

  if (!carta) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Carta no encontrada</p>
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
          <Button variant="outline" size="icon" onClick={() => navigate("/cartas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalle de Carta</h1>
            <p className="text-muted-foreground">
              Carta de {niño ? `${niño.nombre} ${niño.apellidos}` : "Desconocido"}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/cartas/${id}/editar`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Niño</p>
              <p className="text-base">
                {niño ? `${niño.nombre} ${niño.apellidos}` : "Desconocido"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Evento</p>
              <p className="text-base">{evento?.nombre || "Sin evento"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge className={estadoColors[carta.estado]}>{carta.estado}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Carga</p>
              <p className="text-base">
                {new Date(carta.fechaCarga).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos del Niño</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {niño ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Edad</p>
                  <p className="text-base">{niño.edad} años</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Género</p>
                  <p className="text-base">{niño.genero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Escuela</p>
                  <p className="text-base">{niño.escuela}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Intereses</p>
                  <p className="text-base">{niño.intereses}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No hay información del niño disponible</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contenido de la Carta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-6">
            <p className="whitespace-pre-wrap text-foreground">{carta.contenido}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
