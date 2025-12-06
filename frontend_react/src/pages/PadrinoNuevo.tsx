import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PadrinosService } from "@/services/api";

export default function PadrinoNuevo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadPadrino(id);
    }
  }, [isEditing, id]);

  const loadPadrino = async (padrinoId: string) => {
    try {
      setLoading(true);
      const padrino = await PadrinosService.getById(padrinoId);
      if (padrino) {
        setFormData({
          nombre: padrino.nombre,
          email: padrino.email,
          telefono: padrino.telefono || "",
          direccion: padrino.direccion || "",
        });
      }
    } catch (err) {
      toast.error("Error al cargar el padrino");
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

    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditing && id) {
        // Actualizar padrino existente
        const padrinoActualizado = await PadrinosService.update(id, {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
        });

        toast.success(`Padrino ${padrinoActualizado.nombre} actualizado exitosamente`);
        navigate(`/padrinos/${id}`);
      } else {
        // Crear nuevo padrino
        const nuevoPadrino = await PadrinosService.create({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
          fecha_registro: new Date().toISOString().split("T")[0],
          historial_apadrinamiento_ids: [],
        });

        toast.success(`Padrino ${nuevoPadrino.nombre} registrado exitosamente`);
        navigate(`/padrinos/${nuevoPadrino.id_padrino}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : (isEditing ? "Error al actualizar padrino" : "Error al registrar padrino");
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
          {isEditing ? "Editar Padrino" : "Registrar Nuevo Padrino"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Actualiza la información del padrino" : "Completa el formulario para agregar un nuevo padrino"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Padrino</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez García"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ej: juan@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Ej: 449-123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Ej: Av. Universidad 100, Aguascalientes"
                rows={3}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/padrinos")}
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
                  isEditing ? "Actualizar Padrino" : "Registrar Padrino"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
