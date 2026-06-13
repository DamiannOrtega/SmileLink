import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApadrinamientosService,
  EntregasService,
  NinosService,
  PadrinosService,
  PuntosEntregaService,
  Nino,
  Padrino,
  PuntoEntrega,
} from "@/services/api";

export default function EntregaNueva() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idApadrinamiento = searchParams.get("apadrinamiento") || "";

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nino, setNino] = useState<Nino | null>(null);
  const [padrino, setPadrino] = useState<Padrino | null>(null);
  const [puntos, setPuntos] = useState<PuntoEntrega[]>([]);

  const [formData, setFormData] = useState({
    descripcion_regalo: "",
    id_punto_entrega: "",
    fecha_programada: new Date().toISOString().split("T")[0],
    observaciones: "",
  });

  useEffect(() => {
    loadData();
  }, [idApadrinamiento]);

  const loadData = async () => {
    if (!idApadrinamiento) {
      toast.error("Falta la asignación vinculada");
      navigate("/asignaciones");
      return;
    }

    try {
      setLoading(true);
      const asignacion = await ApadrinamientosService.getById(idApadrinamiento);
      if (!asignacion) {
        toast.error("Asignación no encontrada");
        navigate("/asignaciones");
        return;
      }

      if (asignacion.estado_apadrinamiento_registro !== "Activo") {
        toast.error("Solo se pueden registrar entregas en asignaciones activas");
        navigate(`/asignaciones/${idApadrinamiento}`);
        return;
      }

      const [ninoData, padrinoData, puntosData] = await Promise.all([
        NinosService.getById(asignacion.id_nino),
        PadrinosService.getById(asignacion.id_padrino),
        PuntosEntregaService.getActivos(),
      ]);

      setNino(ninoData);
      setPadrino(padrinoData);
      setPuntos(puntosData);

      const descripcionDefault = ninoData?.necesidades?.length
        ? ninoData.necesidades.join(", ")
        : ninoData
          ? `Regalo para ${ninoData.nombre}`
          : "";

      setFormData((prev) => ({
        ...prev,
        descripcion_regalo: descripcionDefault,
        id_punto_entrega: puntosData[0]?.id_punto_entrega || "",
      }));
    } catch {
      toast.error("Error al cargar datos de la asignación");
      navigate("/asignaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descripcion_regalo.trim()) {
      toast.error("La descripción del regalo es requerida");
      return;
    }

    if (!formData.id_punto_entrega) {
      toast.error("Selecciona un punto de entrega");
      return;
    }

    if (!formData.fecha_programada) {
      toast.error("La fecha programada es requerida");
      return;
    }

    try {
      setSubmitting(true);
      const nuevaEntrega = await EntregasService.create({
        id_apadrinamiento: idApadrinamiento,
        id_punto_entrega: formData.id_punto_entrega,
        descripcion_regalo: formData.descripcion_regalo.trim(),
        fecha_programada: formData.fecha_programada,
        estado_entrega: "En Proceso",
        observaciones: formData.observaciones.trim(),
      });

      toast.success("Entrega de regalo registrada exitosamente");
      navigate(`/entregas/${nuevaEntrega.id_entrega}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al registrar la entrega";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Registrar Entrega de Regalo</h1>
        <p className="text-muted-foreground">
          Programa la entrega del regalo para esta asignación
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de la Asignación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Niño</p>
            <p className="font-medium">{nino?.nombre || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Padrino</p>
            <p className="font-medium">{padrino?.nombre || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="descripcion_regalo">
                Descripción del regalo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="descripcion_regalo"
                name="descripcion_regalo"
                value={formData.descripcion_regalo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descripcion_regalo: e.target.value }))
                }
                placeholder="Ej: Mochila escolar, zapatos talla 28"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_punto_entrega">
                Punto de entrega <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.id_punto_entrega}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, id_punto_entrega: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un punto de entrega" />
                </SelectTrigger>
                <SelectContent>
                  {puntos.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No hay puntos de entrega activos
                    </div>
                  ) : (
                    puntos.map((punto) => (
                      <SelectItem key={punto.id_punto_entrega} value={punto.id_punto_entrega}>
                        {punto.nombre_punto} — {punto.direccion_fisica}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_programada">
                Fecha programada <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fecha_programada"
                name="fecha_programada"
                type="date"
                value={formData.fecha_programada}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha_programada: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, observaciones: e.target.value }))
                }
                placeholder="Notas adicionales sobre la entrega"
                rows={3}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/asignaciones/${idApadrinamiento}`)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || puntos.length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Entrega"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
