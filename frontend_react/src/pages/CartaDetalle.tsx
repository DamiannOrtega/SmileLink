import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  SolicitudesService,
  SolicitudRegalo,
  NinosService,
  Nino,
} from "@/services/api";

const estadoColors: Record<SolicitudRegalo["estado_solicitud"], string> = {
  "Abierta": "bg-yellow-500/10 text-yellow-500",
  "En Proceso": "bg-blue-500/10 text-blue-500",
  "Cumplida": "bg-green-500/10 text-green-500",
};

export default function CartaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [solicitud, setSolicitud] = useState<SolicitudRegalo | null>(null);
  const [nino, setNino] = useState<Nino | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const sol = await SolicitudesService.getById(id);
      if (!sol) {
        setSolicitud(null);
        return;
      }
      setSolicitud(sol);

      const ninoData = await NinosService.getById(sol.id_nino);
      setNino(ninoData);
    } catch (err) {
      toast.error("Error al cargar detalles de la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-12 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Solicitud no encontrada</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate("/cartas")}>Volver a la lista</Button>
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
          <Button variant="outline" size="icon" onClick={() => navigate("/cartas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalle de Solicitud/Carta</h1>
            <p className="text-muted-foreground">
              Carta de {nino ? nino.nombre : "Desconocido"}
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
              <p className="text-base">{nino ? nino.nombre : "Desconocido"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge className={estadoColors[solicitud.estado_solicitud]}>
                {solicitud.estado_solicitud}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Carga</p>
              <p className="text-base">
                {new Date(solicitud.fecha_solicitud).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {solicitud.fecha_cierre && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Cierre</p>
                <p className="text-base">
                  {new Date(solicitud.fecha_cierre).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos del Niño</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nino ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Edad</p>
                  <p className="text-base">{nino.edad} años</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Género</p>
                  <p className="text-base">{nino.genero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Intereses y Descripción</p>
                  <p className="text-base">{nino.descripcion || "No especificados"}</p>
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
          <CardTitle>Descripción de la Solicitud / Carta de Deseos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-6">
            <p className="whitespace-pre-wrap text-foreground">{solicitud.descripcion_solicitud}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
