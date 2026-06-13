import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { EventosService } from "@/services/api";

export default function EventoNuevo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre_evento: "",
    tipo_evento: "" as "Navidad" | "Día del Niño" | "Otro" | "",
    fecha_inicio: "",
    fecha_fin: "",
    estado_evento: "Planeado" as "Planeado" | "Activo" | "Cerrado",
    descripcion: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadEvento();
    }
  }, [id, isEditing]);

  const loadEvento = async () => {
    try {
      setLoading(true);
      const ev = await EventosService.getById(id!);
      if (ev) {
        setFormData({
          nombre_evento: ev.nombre_evento,
          tipo_evento: ev.tipo_evento,
          fecha_inicio: ev.fecha_inicio,
          fecha_fin: ev.fecha_fin,
          estado_evento: ev.estado_evento,
          descripcion: ev.descripcion || "",
        });
      }
    } catch (err) {
      toast.error("Error al cargar los datos del evento");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre_evento.trim()) {
      toast.error("El nombre del evento es requerido");
      return;
    }

    if (!formData.tipo_evento) {
      toast.error("El tipo de evento es requerido");
      return;
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast.error("Las fechas son requeridas");
      return;
    }

    if (new Date(formData.fecha_inicio) > new Date(formData.fecha_fin)) {
      toast.error("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && id) {
        await EventosService.update(id, {
          nombre_evento: formData.nombre_evento.trim(),
          tipo_evento: formData.tipo_evento,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          estado_evento: formData.estado_evento,
          descripcion: formData.descripcion.trim(),
        });
        toast.success(`Evento ${formData.nombre_evento} actualizado exitosamente`);
      } else {
        await EventosService.create({
          nombre_evento: formData.nombre_evento.trim(),
          tipo_evento: formData.tipo_evento,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          estado_evento: "Planeado",
          descripcion: formData.descripcion.trim(),
        });
        toast.success(`Evento ${formData.nombre_evento} creado exitosamente`);
      }

      navigate("/eventos");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al guardar el evento";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Editar Evento" : "Nuevo Evento"}
          </h1>
          <p className="text-muted-foreground">Cargando datos del evento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? "Editar Evento" : "Nuevo Evento"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Modifica los datos del evento actual" : "Crea un nuevo evento para el programa"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre_evento">
                Nombre del Evento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre_evento"
                name="nombre_evento"
                value={formData.nombre_evento}
                onChange={handleInputChange}
                placeholder="Ej: Navidad 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_evento">
                Tipo de Evento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tipo_evento}
                onValueChange={(value: "Navidad" | "Día del Niño" | "Otro") =>
                  setFormData((prev) => ({ ...prev, tipo_evento: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Navidad">Navidad</SelectItem>
                  <SelectItem value="Día del Niño">Día del Niño</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="estado_evento">
                  Estado del Evento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.estado_evento}
                  onValueChange={(value: "Planeado" | "Activo" | "Cerrado") =>
                    setFormData((prev) => ({ ...prev, estado_evento: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planeado">Planeado</SelectItem>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">
                  Fecha de Inicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fecha_inicio"
                  name="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_fin">
                  Fecha de Fin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fecha_fin"
                  name="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe el evento..."
                rows={4}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/eventos")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  isEditing ? "Guardar Cambios" : "Crear Evento"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
