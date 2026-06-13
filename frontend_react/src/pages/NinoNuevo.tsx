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
import { Loader2, User } from "lucide-react";

// ✅ IMPORTAR DESDE EL NUEVO SERVICE LAYER
import { NinosService, Nino } from "@/services/api";

// Helper functions for DiceBear Avatars
const parseDiceBearUrl = (url: string) => {
    const defaults = {
        style: "fun-emoji",
        seed: "",
        backgroundColor: "b6e3f4",
        eyes: "plain",
        mouth: "lilSmile",
        isCustomUrl: false,
    };

    if (!url) return defaults;
    if (!url.includes("api.dicebear.com")) {
        return { ...defaults, isCustomUrl: true };
    }

    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Path matches format: /7.x/{style}/svg
        const style = pathParts.length > 2 ? pathParts[2] : "fun-emoji";
        
        const seed = urlObj.searchParams.get("seed") || "";
        const backgroundColor = urlObj.searchParams.get("backgroundColor") || "transparent";
        const eyes = urlObj.searchParams.get("eyes") || "plain";
        const mouth = urlObj.searchParams.get("mouth") || "lilSmile";

        return { style, seed, backgroundColor, eyes, mouth, isCustomUrl: false };
    } catch (e) {
        return { ...defaults, isCustomUrl: true };
    }
};

const buildDiceBearUrl = (params: {
    style: string;
    seed: string;
    backgroundColor: string;
    eyes: string;
    mouth: string;
}) => {
    const { style, seed, backgroundColor, eyes, mouth } = params;
    const baseUrl = `https://api.dicebear.com/7.x/${style}/svg`;
    const searchParams = new URLSearchParams();
    searchParams.set("seed", seed || "seed");
    searchParams.set("size", "128");
    if (backgroundColor && backgroundColor !== "transparent") {
        searchParams.set("backgroundColor", backgroundColor);
    }
    
    // Custom eyes and mouth only apply to fun-emoji
    if (style === "fun-emoji") {
        searchParams.set("eyes", eyes);
        searchParams.set("mouth", mouth);
    }

    return `${baseUrl}?${searchParams.toString()}`;
};

export default function NinoNuevoRefactored() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditing);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: "",
        edad: 0,
        genero: "" as "Masculino" | "Femenino" | "",
        descripcion: "",
        necesidades: "",
        estado_apadrinamiento: "Disponible" as "Disponible" | "Apadrinado",
        foto: "",
    });

    // Estado del modo de foto (avatar generado, subir archivo, o URL externa)
    const [photoMode, setPhotoMode] = useState<"avatar" | "upload" | "url">("avatar");

    // Estado de los parámetros del avatar DiceBear
    const [avatarParams, setAvatarParams] = useState({
        style: "fun-emoji",
        seed: "",
        backgroundColor: "b6e3f4",
        eyes: "plain",
        mouth: "lilSmile",
    });

    useEffect(() => {
        if (!isEditing || !id) return;

        const loadNino = async () => {
            try {
                setLoading(true);
                const nino = await NinosService.getById(id);
                if (!nino) {
                    toast.error("Niño no encontrado");
                    navigate("/ninos");
                    return;
                }

                const parsed = parseDiceBearUrl(nino.foto || "");
                setAvatarParams(parsed);

                if (nino.foto) {
                    if (nino.foto.startsWith("data:image/")) {
                        setPhotoMode("upload");
                    } else if (nino.foto.includes("api.dicebear.com")) {
                        setPhotoMode("avatar");
                    } else {
                        setPhotoMode("url");
                    }
                } else {
                    setPhotoMode("avatar");
                }

                setFormData({
                    nombre: nino.nombre,
                    edad: nino.edad,
                    genero: nino.genero,
                    descripcion: nino.descripcion || "",
                    necesidades: nino.necesidades?.join(", ") || "",
                    estado_apadrinamiento: nino.estado_apadrinamiento,
                    foto: nino.foto || "",
                });
            } catch {
                toast.error("Error al cargar datos del niño");
                navigate("/ninos");
            } finally {
                setLoading(false);
            }
        };

        loadNino();
    }, [id, isEditing, navigate]);

    // Sincronizar automáticamente la semilla con el nombre del niño al escribir
    useEffect(() => {
        if (!isEditing && formData.nombre) {
            setAvatarParams(prev => {
                if (photoMode === "avatar" && !prev.seed) {
                    return { ...prev, seed: formData.nombre };
                }
                return prev;
            });
        }
    }, [formData.nombre, isEditing, photoMode]);

    // Reconstruir la URL de DiceBear cuando cambian los parámetros
    useEffect(() => {
        if (photoMode === "avatar") {
            const newUrl = buildDiceBearUrl(avatarParams);
            setFormData(prev => ({ ...prev, foto: newUrl }));
        }
    }, [avatarParams, photoMode]);

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

            const necesidades = formData.necesidades
                .split(",")
                .map((n) => n.trim())
                .filter((n) => n.length > 0);

            if (isEditing && id) {
                const ninoActualizado = await NinosService.update(id, {
                    nombre: formData.nombre.trim(),
                    edad: formData.edad,
                    genero: formData.genero as "Masculino" | "Femenino",
                    descripcion: formData.descripcion.trim(),
                    necesidades,
                    estado_apadrinamiento: formData.estado_apadrinamiento,
                    foto: formData.foto.trim() || undefined,
                });

                toast.success(`Niño ${ninoActualizado.nombre} actualizado exitosamente`);
                navigate(`/ninos/${ninoActualizado.id_nino || id}`);
            } else {
                const nuevoNino = await NinosService.create({
                    nombre: formData.nombre.trim(),
                    edad: formData.edad,
                    genero: formData.genero as "Masculino" | "Femenino",
                    descripcion: formData.descripcion.trim(),
                    necesidades,
                    estado_apadrinamiento: "Disponible",
                    foto: formData.foto.trim() || undefined,
                });

                toast.success(`Niño ${nuevoNino.nombre} registrado exitosamente`);
                navigate(`/ninos/${nuevoNino.id_nino}`);
            }
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : isEditing
                        ? "Error al actualizar niño"
                        : "Error al registrar niño";
            toast.error(errorMsg);
            console.error(isEditing ? "Error al actualizar niño:" : "Error al crear niño:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Breadcrumbs />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs />

            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    {isEditing ? "Editar Niño" : "Registrar Nuevo Niño"}
                </h1>
                <p className="text-muted-foreground">
                    {isEditing
                        ? "Modifica los datos del niño y guarda los cambios"
                        : "Completa el formulario para agregar un nuevo beneficiario"}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Niño</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Columna Foto / Avatar */}
                            <div className="md:col-span-1 flex flex-col p-4 border border-dashed border-border rounded-lg bg-muted/20 space-y-4">
                                <Label className="text-sm font-semibold text-center w-full">Foto de Perfil (MongoDB)</Label>
                                
                                <div className="flex justify-center">
                                    <div className="aspect-square w-32 relative overflow-hidden rounded-full border-2 border-primary/20 bg-background flex items-center justify-center shadow-md">
                                        {formData.foto ? (
                                            <img src={formData.foto} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-12 w-12 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>

                                {/* Toggle Mode - 3 Tabs */}
                                <div className="flex gap-1 p-1 bg-muted rounded-md text-[10px] sm:text-xs">
                                    <button
                                        type="button"
                                        className={`flex-1 py-1 rounded-sm font-medium transition-colors ${photoMode === "avatar" ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setPhotoMode("avatar")}
                                    >
                                        Diseñar
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-1 rounded-sm font-medium transition-colors ${photoMode === "upload" ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setPhotoMode("upload")}
                                    >
                                        Subir
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-1 rounded-sm font-medium transition-colors ${photoMode === "url" ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setPhotoMode("url")}
                                    >
                                        Enlace
                                    </button>
                                </div>

                                {photoMode === "avatar" && (
                                    <div className="space-y-3 pt-1">
                                        {/* Semilla (Semilla del Avatar) */}
                                        <div className="space-y-1">
                                            <Label htmlFor="avatar-seed" className="text-xs">Semilla (Expresión Base)</Label>
                                            <Input
                                                id="avatar-seed"
                                                value={avatarParams.seed}
                                                onChange={(e) => setAvatarParams(prev => ({ ...prev, seed: e.target.value }))}
                                                placeholder="Ej: Nombre o palabra clave"
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        {/* Estilo (Style) */}
                                        <div className="space-y-1">
                                            <Label className="text-xs">Estilo de Personaje</Label>
                                            <Select
                                                value={avatarParams.style}
                                                onValueChange={(val) => setAvatarParams(prev => ({ ...prev, style: val }))}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fun-emoji">Emoji Divertido</SelectItem>
                                                    <SelectItem value="adventurer">Aventurero</SelectItem>
                                                    <SelectItem value="lorelei">Lorelei (Retrato)</SelectItem>
                                                    <SelectItem value="bottts">Robot</SelectItem>
                                                    <SelectItem value="avataaars">Humano</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Color de Fondo (Background Color) */}
                                        <div className="space-y-1">
                                            <Label className="text-xs">Color de Fondo</Label>
                                            <Select
                                                value={avatarParams.backgroundColor}
                                                onValueChange={(val) => setAvatarParams(prev => ({ ...prev, backgroundColor: val }))}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="transparent">Transparente</SelectItem>
                                                    <SelectItem value="b6e3f4">Celeste Claro</SelectItem>
                                                    <SelectItem value="c0aede">Lavanda</SelectItem>
                                                    <SelectItem value="d1e4e6">Gris Neutro</SelectItem>
                                                    <SelectItem value="ffd5dc">Rosado</SelectItem>
                                                    <SelectItem value="ffdfbf">Durazno</SelectItem>
                                                    <SelectItem value="c4f2d2">Verde Menta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Custom Features for fun-emoji */}
                                        {avatarParams.style === "fun-emoji" && (
                                            <>
                                                {/* Expresión de Ojos */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Ojos (Mirada)</Label>
                                                    <Select
                                                        value={avatarParams.eyes}
                                                        onValueChange={(val) => setAvatarParams(prev => ({ ...prev, eyes: val }))}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="plain">Normales</SelectItem>
                                                            <SelectItem value="cute">Tiernos</SelectItem>
                                                            <SelectItem value="wink">Guiño 1</SelectItem>
                                                            <SelectItem value="wink2">Guiño 2</SelectItem>
                                                            <SelectItem value="glasses">Con Lentes</SelectItem>
                                                            <SelectItem value="closed">Cerrados</SelectItem>
                                                            <SelectItem value="closed2">Cerrados Felices</SelectItem>
                                                            <SelectItem value="love">Corazones (Amor)</SelectItem>
                                                            <SelectItem value="stars">Estrellas</SelectItem>
                                                            <SelectItem value="shades">Lentes de Sol</SelectItem>
                                                            <SelectItem value="crying">Llorando</SelectItem>
                                                            <SelectItem value="sleepClose">Durmiendo</SelectItem>
                                                            <SelectItem value="sad">Tristes</SelectItem>
                                                            <SelectItem value="tearDrop">Lágrima</SelectItem>
                                                            <SelectItem value="pissed">Enojados</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Expresión de Boca */}
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Boca (Expresión)</Label>
                                                    <Select
                                                        value={avatarParams.mouth}
                                                        onValueChange={(val) => setAvatarParams(prev => ({ ...prev, mouth: val }))}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="lilSmile">Pequeña Sonrisa</SelectItem>
                                                            <SelectItem value="smileTeeth">Sonrisa con Dientes</SelectItem>
                                                            <SelectItem value="smileLol">Risa Alegre</SelectItem>
                                                            <SelectItem value="wideSmile">Sonrisa Grande</SelectItem>
                                                            <SelectItem value="plain">Seria (Línea)</SelectItem>
                                                            <SelectItem value="sad">Triste</SelectItem>
                                                            <SelectItem value="shy">Tímida</SelectItem>
                                                            <SelectItem value="cute">Tierna</SelectItem>
                                                            <SelectItem value="shout">Gritando</SelectItem>
                                                            <SelectItem value="pissed">Enojada</SelectItem>
                                                            <SelectItem value="drip">Baba (Antojo)</SelectItem>
                                                            <SelectItem value="tongueOut">Lengua Fuera</SelectItem>
                                                            <SelectItem value="kissHeart">Beso</SelectItem>
                                                            <SelectItem value="sick">Enferma</SelectItem>
                                                            <SelectItem value="faceMask">Cubrebocas</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        )}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs mt-2"
                                            onClick={() => {
                                                const randomSeeds = ["Sofia", "Carlos", "Mateo", "Valentina", "Sebastian", "Camila", "Diego", "Lucia", "Nicolas", "Elena"];
                                                const randomSeed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + '-' + Math.floor(Math.random() * 1000);
                                                
                                                const eyeOptions = ["cute", "wink", "wink2", "plain", "glasses", "closed", "love", "stars", "shades", "closed2", "crying", "sleepClose", "sad", "tearDrop", "pissed"];
                                                const mouthOptions = ["plain", "lilSmile", "sad", "shy", "cute", "wideSmile", "shout", "smileTeeth", "smileLol", "pissed", "drip", "tongueOut", "kissHeart", "sick", "faceMask"];
                                                const colorOptions = ["transparent", "b6e3f4", "c0aede", "d1e4e6", "ffd5dc", "ffdfbf", "c4f2d2"];

                                                setAvatarParams(prev => ({
                                                    ...prev,
                                                    seed: randomSeed,
                                                    backgroundColor: colorOptions[Math.floor(Math.random() * colorOptions.length)],
                                                    eyes: eyeOptions[Math.floor(Math.random() * eyeOptions.length)],
                                                    mouth: mouthOptions[Math.floor(Math.random() * mouthOptions.length)],
                                                }));
                                            }}
                                        >
                                            Generar Diseño Aleatorio
                                        </Button>
                                    </div>
                                )}

                                {photoMode === "upload" && (
                                    <div className="space-y-2 pt-1 w-full">
                                        <Label htmlFor="file-upload" className="text-xs font-semibold">Subir Imagen desde Equipo</Label>
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                
                                                if (file.size > 2 * 1024 * 1024) {
                                                    toast.error("La imagen supera el límite de 2MB");
                                                    return;
                                                }

                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const base64String = reader.result as string;
                                                    setFormData(prev => ({ ...prev, foto: base64String }));
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                            className="h-9 text-xs cursor-pointer"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Límite de 2MB. La imagen se convertirá a Base64 y se guardará como documento binario en MongoDB.
                                        </p>
                                    </div>
                                )}

                                {photoMode === "url" && (
                                    <div className="space-y-2 pt-1">
                                        <Label htmlFor="foto" className="text-xs font-semibold">URL de Foto Personalizada</Label>
                                        <Input
                                            id="foto"
                                            name="foto"
                                            value={formData.foto.startsWith("data:image/") ? "" : formData.foto}
                                            onChange={handleInputChange}
                                            placeholder="https://ejemplo.com/foto.jpg"
                                            className="h-8 text-xs"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Ingresa un enlace directo a la imagen. Se guardará en MongoDB.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Columna Campos de Texto */}
                            <div className="md:col-span-2 space-y-4">
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
                            </div>
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
                                ) : isEditing ? (
                                    "Guardar Cambios"
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
