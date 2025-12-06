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
import { Skeleton } from "@/components/ui/skeleton";
import { PuntosEntregaService } from "@/services/api";

export default function UbicacionNueva() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    nombre_punto: "",
    direccion_fisica: "",
    latitud: "",
    longitud: "",
    horario_atencion: "",
    contacto_referencia: "",
    estado_punto: "Activo" as "Activo" | "Inactivo",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadUbicacion(id);
    }
  }, [isEditing, id]);

  const loadUbicacion = async (ubicacionId: string) => {
    try {
      setLoading(true);
      const ubicacion = await PuntosEntregaService.getById(ubicacionId);
      if (ubicacion) {
        setFormData({
          nombre_punto: ubicacion.nombre_punto,
          direccion_fisica: ubicacion.direccion_fisica,
          latitud: ubicacion.latitud.toString(),
          longitud: ubicacion.longitud.toString(),
          horario_atencion: ubicacion.horario_atencion || "",
          contacto_referencia: ubicacion.contacto_referencia || "",
          estado_punto: ubicacion.estado_punto,
        });
      }
    } catch (err) {
      toast.error("Error al cargar la ubicación");
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

    if (!formData.nombre_punto.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!formData.direccion_fisica.trim()) {
      toast.error("La dirección es requerida");
      return;
    }

    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(formData.longitud);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Las coordenadas deben ser números válidos");
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditing && id) {
        // Actualizar ubicación existente
        const ubicacionActualizada = await PuntosEntregaService.update(id, {
          nombre_punto: formData.nombre_punto.trim(),
          direccion_fisica: formData.direccion_fisica.trim(),
          latitud: lat,
          longitud: lng,
          horario_atencion: formData.horario_atencion.trim(),
          contacto_referencia: formData.contacto_referencia.trim(),
          estado_punto: formData.estado_punto,
        });

        toast.success(`Ubicación ${ubicacionActualizada.nombre_punto} actualizada exitosamente`);
        navigate(`/ubicaciones/${id}`);
      } else {
        // Crear nueva ubicación
        const nuevaUbicacion = await PuntosEntregaService.create({
          nombre_punto: formData.nombre_punto.trim(),
          direccion_fisica: formData.direccion_fisica.trim(),
          latitud: lat,
          longitud: lng,
          horario_atencion: formData.horario_atencion.trim(),
          contacto_referencia: formData.contacto_referencia.trim(),
          estado_punto: formData.estado_punto,
        });

        toast.success(`Ubicación ${nuevaUbicacion.nombre_punto} creada exitosamente`);
        navigate(`/ubicaciones/${nuevaUbicacion.id_punto_entrega}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : (isEditing ? "Error al actualizar ubicación" : "Error al crear ubicación");
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
          {isEditing ? "Editar Ubicación" : "Nueva Ubicación"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Actualiza la información del punto de entrega" : "Registra un nuevo punto de entrega"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Ubicación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre_punto">
                Nombre del Punto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre_punto"
                name="nombre_punto"
                value={formData.nombre_punto}
                onChange={handleInputChange}
                placeholder="Ej: Centro de Acopio Norte"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion_fisica">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="direccion_fisica"
                name="direccion_fisica"
                value={formData.direccion_fisica}
                onChange={handleInputChange}
                placeholder="Ej: Calle Norte 45, Centro, Aguascalientes"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitud">
                  Latitud <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="latitud"
                  name="latitud"
                  type="number"
                  step="any"
                  value={formData.latitud}
                  onChange={handleInputChange}
                  placeholder="Ej: 21.8853"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitud">
                  Longitud <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="longitud"
                  name="longitud"
                  type="number"
                  step="any"
                  value={formData.longitud}
                  onChange={handleInputChange}
                  placeholder="Ej: -102.2916"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario_atencion">Horario de Atención</Label>
              <Input
                id="horario_atencion"
                name="horario_atencion"
                value={formData.horario_atencion}
                onChange={handleInputChange}
                placeholder="Ej: Lun-Vie 9:00-17:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacto_referencia">Contacto de Referencia</Label>
              <Input
                id="contacto_referencia"
                name="contacto_referencia"
                value={formData.contacto_referencia}
                onChange={handleInputChange}
                placeholder="Ej: Sra. Martha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado_punto">Estado</Label>
              <Select
                value={formData.estado_punto}
                onValueChange={(value: "Activo" | "Inactivo") =>
                  setFormData((prev) => ({ ...prev, estado_punto: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/ubicaciones")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  isEditing ? "Actualizar Ubicación" : "Crear Ubicación"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
