import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  NinosService,
  PadrinosService,
  Nino,
  Padrino
} from "@/services/api";

export default function AsignacionNueva() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [padrinos, setPadrinos] = useState<Padrino[]>([]);

  const [formData, setFormData] = useState({
    id_nino: "",
    id_padrino: "",
    tipo_apadrinamiento: "" as "Aleatorio" | "Elección Padrino" | "",
    estado_apadrinamiento_registro: "Activo" as "Activo" | "Finalizado",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ninosData, padrinosData] = await Promise.all([
        NinosService.getAll(),
        PadrinosService.getAll()
      ]);

      setPadrinos(padrinosData);

      if (isEditing && id) {
        const asignacion = await ApadrinamientosService.getById(id);
        if (!asignacion) {
          toast.error("Asignación no encontrada");
          navigate("/asignaciones");
          return;
        }

        const ninoActual = ninosData.find((n) => n.id_nino === asignacion.id_nino);
        const disponibles = ninosData.filter((n) => n.estado_apadrinamiento === "Disponible");
        const ninosParaSelect =
          ninoActual && !disponibles.some((n) => n.id_nino === ninoActual.id_nino)
            ? [ninoActual, ...disponibles]
            : disponibles;

        setNinos(ninosParaSelect);
        setFormData({
          id_nino: asignacion.id_nino,
          id_padrino: asignacion.id_padrino,
          tipo_apadrinamiento: asignacion.tipo_apadrinamiento,
          estado_apadrinamiento_registro: asignacion.estado_apadrinamiento_registro,
        });
      } else {
        setNinos(ninosData.filter((n) => n.estado_apadrinamiento === "Disponible"));
      }
    } catch {
      toast.error("Error al cargar datos");
      if (isEditing) navigate("/asignaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_nino) {
      toast.error("Selecciona un niño");
      return;
    }

    if (!formData.id_padrino) {
      toast.error("Selecciona un padrino");
      return;
    }

    if (!formData.tipo_apadrinamiento) {
      toast.error("Selecciona el tipo de apadrinamiento");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && id) {
        const asignacionActualizada = await ApadrinamientosService.update(id, {
          tipo_apadrinamiento: formData.tipo_apadrinamiento,
          estado_apadrinamiento_registro: formData.estado_apadrinamiento_registro,
        });

        toast.success("Asignación actualizada exitosamente");
        navigate(`/asignaciones/${asignacionActualizada.id_apadrinamiento || id}`);
      } else {
        const nuevaAsignacion = await ApadrinamientosService.create({
          id_nino: formData.id_nino,
          id_padrino: formData.id_padrino,
          fecha_inicio: new Date().toISOString().split("T")[0],
          tipo_apadrinamiento: formData.tipo_apadrinamiento,
          estado_apadrinamiento_registro: "Activo",
          entregas_ids: [],
        });

        await NinosService.update(formData.id_nino, {
          estado_apadrinamiento: "Apadrinado",
          id_padrino_actual: formData.id_padrino,
          fecha_apadrinamiento_actual: new Date().toISOString().split("T")[0],
        });

        toast.success("Asignación creada exitosamente");
        navigate(`/asignaciones/${nuevaAsignacion.id_apadrinamiento}`);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : isEditing
            ? "Error al actualizar asignación"
            : "Error al crear asignación";
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
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? "Editar Asignación" : "Nueva Asignación"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Modifica los datos del apadrinamiento y guarda los cambios"
            : "Crea un nuevo apadrinamiento entre un niño y un padrino"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="id_nino">
                Niño <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.id_nino}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, id_nino: value }))}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un niño" />
                </SelectTrigger>
                <SelectContent>
                  {ninos.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No hay niños disponibles
                    </div>
                  ) : (
                    ninos.map((nino) => (
                      <SelectItem key={nino.id_nino} value={nino.id_nino}>
                        {nino.nombre} ({nino.edad} años)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  El niño asignado no se puede cambiar en una asignación existente
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_padrino">
                Padrino <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.id_padrino}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, id_padrino: value }))}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un padrino" />
                </SelectTrigger>
                <SelectContent>
                  {padrinos.map((padrino) => (
                    <SelectItem key={padrino.id_padrino} value={padrino.id_padrino}>
                      {padrino.nombre} ({padrino.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  El padrino asignado no se puede cambiar en una asignación existente
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Apadrinamiento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tipo_apadrinamiento}
                onValueChange={(value: "Aleatorio" | "Elección Padrino") =>
                  setFormData((prev) => ({ ...prev, tipo_apadrinamiento: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elección Padrino">Elección Padrino</SelectItem>
                  <SelectItem value="Aleatorio">Aleatorio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="estado">
                  Estado <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.estado_apadrinamiento_registro}
                  onValueChange={(value: "Activo" | "Finalizado") =>
                    setFormData((prev) => ({ ...prev, estado_apadrinamiento_registro: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/asignaciones")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Guardando..." : "Creando..."}
                  </>
                ) : isEditing ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Asignación"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
