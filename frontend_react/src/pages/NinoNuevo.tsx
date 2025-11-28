import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

// ✅ IMPORTAR DESDE EL NUEVO SERVICE LAYER
import { NinosService, Nino } from "@/services/api";

export default function NinoNuevoRefactored() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: "",
        edad: 0,
        genero: "" as "Masculino" | "Femenino" | "",
        descripcion: "",
        necesidades: "",
        estado_apadrinamiento: "Disponible" as const,
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "edad" ? parseInt(value) || 0 : value,
        }));
    };

    const handleGeneroChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            genero: value as "Masculino" | "Femenino",
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones básicas
        if (!formData.nombre.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        if (!formData.genero) {
            toast.error("El género es requerido");
            return;
        }

        if (formData.edad < 1 || formData.edad > 18) {
            toast.error("La edad debe estar entre 1 y 18 años");
            return;
        }

        try {
            setSubmitting(true);

            // ✅ CREAR NIÑO USANDO EL SERVICE
            const nuevoNino = await NinosService.create({
                nombre: formData.nombre.trim(),
                edad: formData.edad,
                genero: formData.genero,
                descripcion: formData.descripcion.trim(),
                necesidades: formData.necesidades
                    .split(",")
                    .map((n) => n.trim())
                    .filter((n) => n.length > 0),
                estado_apadrinamiento: "Disponible",
            });

            toast.success(`Niño ${nuevoNino.nombre} registrado exitosamente`);

            // Redirigir a la lista o al detalle del niño creado
            navigate(`/ninos/${nuevoNino.id_nino}`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Error al registrar niño";
            toast.error(errorMsg);
            console.error("Error al crear niño:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumbs />

            <div>
                <h1 className="text-3xl font-bold text-foreground">Registrar Nuevo Niño</h1>
                <p className="text-muted-foreground">
                    Completa el formulario para agregar un nuevo beneficiario
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Niño</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre">
                                Nombre Completo <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                placeholder="Ej: Sofía Martínez"
                                required
                            />
                        </div>

                        {/* Edad y Género */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edad">
                                    Edad <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edad"
                                    name="edad"
                                    type="number"
                                    min="1"
                                    max="18"
                                    value={formData.edad || ""}
                                    onChange={handleInputChange}
                                    placeholder="Ej: 8"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="genero">
                                    Género <span className="text-destructive">*</span>
                                </Label>
                                <Select value={formData.genero} onValueChange={handleGeneroChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona género" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                placeholder="Ej: Le gusta dibujar y los gatos"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                Describe los intereses y personalidad del niño
                            </p>
                        </div>

                        {/* Necesidades */}
                        <div className="space-y-2">
                            <Label htmlFor="necesidades">Necesidades</Label>
                            <Input
                                id="necesidades"
                                name="necesidades"
                                value={formData.necesidades}
                                onChange={handleInputChange}
                                placeholder="Ej: Mochila, Zapatos escolares, Útiles"
                            />
                            <p className="text-xs text-muted-foreground">
                                Separa las necesidades con comas
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/ninos")}
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
                                    "Registrar Niño"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
