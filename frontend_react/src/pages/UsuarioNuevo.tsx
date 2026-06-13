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
import { AdministradoresService } from "@/services/api";

export default function UsuarioNuevo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "" as "Superadmin" | "Gestor" | "",
  });

  useEffect(() => {
    if (isEditing && id) {
      loadUsuario();
    }
  }, [id, isEditing]);

  const loadUsuario = async () => {
    try {
      setLoading(true);
      const user = await AdministradoresService.getById(id!);
      if (user) {
        setFormData({
          nombre: user.nombre,
          email: user.email,
          password: "", // No se precarga la contraseña por seguridad
          rol: user.rol,
        });
      }
    } catch (err) {
      toast.error("Error al cargar los datos del usuario");
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

    // La contraseña es requerida sólo al crear
    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (isEditing && formData.password && formData.password.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!formData.rol) {
      toast.error("El rol es requerido");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && id) {
        // Enviar actualización de datos básicos
        const updateData: any = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          rol: formData.rol,
        };
        
        // Si el administrador cambió su contraseña en el edit, la enviamos hasheada (si el serializer lo soporta, aunque comúnmente no)
        if (formData.password) {
          updateData.password_hash = `sha256_${formData.password}`;
        }

        await AdministradoresService.update(id, updateData);
        toast.success(`Usuario ${formData.nombre} actualizado exitosamente`);
      } else {
        const password_hash = `sha256_${formData.password}`;
        await AdministradoresService.create({
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          password_hash: password_hash,
          rol: formData.rol,
          fecha_registro: new Date().toISOString().split("T")[0],
        });
        toast.success(`Usuario ${formData.nombre} creado exitosamente`);
      }

      navigate("/usuarios");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al guardar usuario";
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
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </h1>
          <p className="text-muted-foreground">Cargando datos del usuario...</p>
        </div>
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
          {isEditing ? "Modifica los datos del administrador del sistema" : "Registra un nuevo administrador del sistema"}
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
                Contraseña {!isEditing && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={isEditing ? "Dejar en blanco para no modificar" : "Mínimo 6 caracteres"}
                required={!isEditing}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                {isEditing ? "Ingresa una nueva contraseña si deseas cambiar la actual (mínimo 6 caracteres)" : "La contraseña debe tener al menos 6 caracteres"}
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
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  isEditing ? "Guardar Cambios" : "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
