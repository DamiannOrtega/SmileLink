import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AdministradoresService } from "@/services/api";

export default function UsuarioNuevo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "" as "Superadmin" | "Gestor" | "",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadUsuario(id);
    }
  }, [isEditing, id]);

  const loadUsuario = async (usuarioId: string) => {
    try {
      setLoading(true);
      const usuario = await AdministradoresService.getById(usuarioId);
      if (usuario) {
        setFormData({
          nombre: usuario.nombre,
          email: usuario.email,
          password: "", // No cargar contraseña por seguridad
          rol: usuario.rol,
        });
      }
    } catch (err) {
      toast.error("Error al cargar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
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

    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!formData.rol) {
      toast.error("El rol es requerido");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && id) {
        // Actualizar usuario existente
        const updateData: any = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          rol: formData.rol,
        };
        
        // Solo actualizar contraseña si se proporcionó una nueva
        if (formData.password && formData.password.length >= 6) {
          updateData.password_hash = `sha256_${formData.password}`;
        }

        const usuarioActualizado = await AdministradoresService.update(id, updateData);

        toast.success(`Usuario ${usuarioActualizado.nombre} actualizado exitosamente`);
        navigate(`/usuarios`);
      } else {
        // Crear nuevo usuario
        // En producción, aquí se haría un hash de la contraseña
        const password_hash = `sha256_${formData.password}`;

        const nuevoUsuario = await AdministradoresService.create({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password_hash: password_hash,
          rol: formData.rol,
          fecha_registro: new Date().toISOString().split("T")[0],
        });

        toast.success(`Usuario ${nuevoUsuario.nombre} creado exitosamente`);
        navigate(`/usuarios`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : (isEditing ? "Error al actualizar usuario" : "Error al crear usuario");
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
          {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Actualiza la información del administrador" : "Registra un nuevo administrador del sistema"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
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
                placeholder="Ej: Ana García Rodríguez"
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
                placeholder="Ej: ana.garcia@smilelink.org"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"} <span className="text-destructive">{!isEditing && "*"}</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={isEditing ? "Dejar vacío para mantener la actual" : "Mínimo 6 caracteres"}
                required={!isEditing}
                minLength={isEditing ? 0 : 6}
              />
              <p className="text-xs text-muted-foreground">
                {isEditing ? "Solo completa si deseas cambiar la contraseña" : "La contraseña debe tener al menos 6 caracteres"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">
                Rol <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.rol}
                onValueChange={(value: "Superadmin" | "Gestor") =>
                  setFormData((prev) => ({ ...prev, rol: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Superadmin">Superadmin</SelectItem>
                  <SelectItem value="Gestor">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/usuarios")}
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
                  isEditing ? "Actualizar Usuario" : "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
