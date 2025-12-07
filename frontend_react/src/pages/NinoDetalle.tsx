import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowLeft, Pencil, User, Gift, Wand2, Save, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
// NO Select needed anymore
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NinosService,
  Nino,
  ApadrinamientosService,
  Apadrinamiento,
  PadrinosService
} from "@/services/api";

// --- CONSTANTES SIMPLIFICADAS ---

const AVATAR_STYLES_SIMPLE = {
  "avataaars": "Real (Historieta)",
  "pixel-art": "Pixel (Retro)",
  "adventurer": "Acción (Aventuras)",
  "open-peeps": "Dibujo (Trazos)"
};

export default function NinoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nino, setNino] = useState<Nino | null>(null);
  const [apadrinamientos, setApadrinamientos] = useState<Apadrinamiento[]>([]);
  const [padrinosMap, setPadrinosMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [liberating, setLiberating] = useState(false);

  // --- ESTADO ULTRA-SIMPLIFICADO ---
  const [style, setStyle] = useState("avataaars");
  const [seed, setSeed] = useState("custom-avatar");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ninoData, apadrinamientosData, padrinosData] = await Promise.all([
        NinosService.getById(id),
        ApadrinamientosService.getByNino(id),
        PadrinosService.getAll()
      ]);

      setNino(ninoData);

      // Filtrar apadrinamientos que pertenecen a este niño específico
      // (el backend debería hacerlo, pero lo verificamos aquí por seguridad)
      const apadrinamientosDelNino = apadrinamientosData.filter(
        (apad) => apad.id_nino === id
      );

      // También validar que los padrinos existan
      const padrinosIds = new Set(padrinosData.map(p => p.id_padrino));
      const apadrinamientosValidos = apadrinamientosDelNino.filter(
        (apad) => padrinosIds.has(apad.id_padrino)
      );

      setApadrinamientos(apadrinamientosValidos);
      setPadrinosMap(new Map(padrinosData.map(p => [p.id_padrino, p.nombre])));
    } catch (err) {
      toast.error("Error al cargar datos del niño");
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    // Base URL de DiceBear - probar con diferentes versiones según el estilo
    // Algunos estilos funcionan mejor con v6, otros con v7
    let baseUrl: string;
    if (style === "avataaars" || style === "open-peeps") {
      // Para estos estilos, usar v6 que es más estable
      baseUrl = `https://api.dicebear.com/6.x/${style}/png`;
    } else {
      // Para otros estilos, usar v7
      baseUrl = `https://api.dicebear.com/7.x/${style}/png`;
    }
    
    // Parámetros base usando URLSearchParams - semilla aleatoria sin género
    const searchParams = new URLSearchParams();
    searchParams.set('seed', seed);
    searchParams.set('backgroundColor', 'b6e3f4');
    searchParams.set('size', '400');

    // Construir URL con parámetros
    const url = `${baseUrl}?${searchParams.toString()}`;
    return url;
  };

  // Helper para corregir URLs de localhost a IP real
  const resolveImageUrl = (url?: string) => {
    if (!url) return "";
    // Si el backend devuelve localhost, lo forzamos a la IP real
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      return url.replace("localhost", "192.168.193.177").replace("127.0.0.1", "192.168.193.177");
    }
    // Si ya es http remoto (ej ui-avatars), dejarlo
    if (url.startsWith("http")) return url;

    // Si es relativo, añadir base
    return `${import.meta.env.VITE_API_URL || 'http://192.168.193.177:8000'}${url}`;
  };

  const regenerateSeed = () => {
    // Regenerar semilla para obtener un avatar diferente
    const randomPart = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    setSeed(randomPart);
  };
  
  // Regenerar semilla cuando cambia el estilo para que se vea diferente
  useEffect(() => {
    if (nino && isDialogOpen) {
      // Cuando cambia el estilo, regenerar semilla para nuevo avatar
      const randomPart = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      setSeed(randomPart);
    }
  }, [style, isDialogOpen]);

  const handleSaveAvatar = async () => {
    if (!nino) return;
    try {
      setSavingAvatar(true);
      toast.info("Guardando...");
      const response = await fetch(getAvatarUrl());
      const blob = await response.blob();
      const file = new File([blob], `avatar_${style}.png`, { type: "image/png" });
      const uploadResult = await NinosService.uploadAvatar(nino.id_nino, file);
      setNino({ ...nino, avatar_url: uploadResult.avatar_url });
      toast.success("¡Guardado!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar.");
    } finally {
      setSavingAvatar(false);
    }
  };

  // Verificar si todos los apadrinamientos activos están finalizados
  const canBeLiberated = () => {
    if (!nino || nino.estado_apadrinamiento !== "Apadrinado") return false;
    
    // Obtener solo apadrinamientos activos (no finalizados)
    const apadrinamientosActivos = apadrinamientos.filter(
      apad => apad.estado_apadrinamiento_registro === "Activo"
    );
    
    // Si no hay apadrinamientos activos, significa que todos están finalizados
    return apadrinamientosActivos.length === 0 && apadrinamientos.length > 0;
  };

  const handleLiberarNino = async () => {
    if (!nino || !canBeLiberated()) return;
    
    if (!confirm(
      `¿Estás seguro de que deseas marcar a ${nino.nombre} como disponible para apadrinar?\n\n` +
      `Esto permitirá que el niño aparezca nuevamente en la sección "Descubrir" para que otro padrino pueda apadrinarlo.`
    )) {
      return;
    }

    try {
      setLiberating(true);
      await NinosService.update(nino.id_nino, {
        estado_apadrinamiento: "Disponible",
        id_padrino_actual: null,
        fecha_apadrinamiento_actual: null
      });
      
      toast.success(`${nino.nombre} ahora está disponible para ser apadrinado nuevamente`);
      await loadData(); // Recargar datos para reflejar el cambio
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Error al liberar al niño");
    } finally {
      setLiberating(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!nino) return null;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{nino.nombre}</h1>
          <p className="text-muted-foreground">Detalles del niño beneficiario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/ninos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate(`/ninos/${id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted flex items-center justify-center mb-4 group ring-1 ring-border">
              {nino.avatar_url ? (
                <img
                  src={resolveImageUrl(nino.avatar_url)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-20 w-20 text-muted-foreground" />
              )}

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Diseñar Avatar"
                  >
                    <Wand2 className="h-4 w-4 text-purple-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Elige tu Avatar</DialogTitle>
                    <DialogDescription>
                      Selecciona el estilo que más te guste.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Preview Centrado */}
                    <div className="flex flex-col items-center justify-center relative">
                      <img
                        key={`${style}-${seed}`}
                        src={getAvatarUrl()}
                        alt="Preview"
                        className="w-48 h-48 rounded-full shadow-lg bg-white object-contain border-4 border-primary/10"
                        onError={(e) => {
                          console.error('Error cargando avatar:', getAvatarUrl());
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-4"
                        onClick={regenerateSeed}
                      >
                        <Wand2 className="h-3 w-3 mr-2" /> ¡Variar!
                      </Button>
                    </div>

                    {/* Estilo */}
                    <div className="space-y-3">
                      <Label className="text-center block">¿Qué estilo prefieres?</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(AVATAR_STYLES_SIMPLE).map(([key, label]) => (
                          <Button
                            key={key}
                            variant={style === key ? "secondary" : "ghost"}
                            className={`justify-center h-auto py-2 ${style === key ? "ring-2 ring-primary" : ""}`}
                            onClick={() => setStyle(key)}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                  </div>

                  <DialogFooter>
                    <Button onClick={handleSaveAvatar} disabled={savingAvatar} className="w-full">
                      {savingAvatar ? "Guardando..." : "¡Me gusta este!"}
                      {!savingAvatar && <Save className="ml-2 h-4 w-4" />}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </div>

            {/* Info Restante */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{nino.id_nino}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Estado</p>
                <Badge variant={nino.estado_apadrinamiento === "Disponible" ? "destructive" : "default"}>
                  {nino.estado_apadrinamiento}
                </Badge>
              </div>
              {canBeLiberated() && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Todos los apadrinamientos están finalizados. Puedes marcar al niño como disponible.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleLiberarNino}
                    disabled={liberating}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {liberating ? "Marcando como disponible..." : "Marcar como Disponible"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resto de tarjetas (Info Personal, Necesidades, Historial) se mantienen igual */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{nino.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Edad</p>
                <p className="font-medium">{nino.edad} años</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{nino.genero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Padrino Actual</p>
                <p className="font-medium">
                  {nino.id_padrino_actual
                    ? padrinosMap.get(nino.id_padrino_actual) || "N/A"
                    : "Sin padrino"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="font-medium">{nino.descripcion || "No especificado"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Necesidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nino.necesidades.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {nino.necesidades.map((necesidad, index) => (
                <Badge key={index} variant="secondary">
                  {necesidad}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay necesidades registradas</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Apadrinamientos</CardTitle>
        </CardHeader>
        <CardContent>
          {apadrinamientos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Padrino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entregas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apadrinamientos.map((apad) => (
                  <TableRow key={apad.id_apadrinamiento}>
                    <TableCell className="font-mono text-xs">{apad.id_apadrinamiento}</TableCell>
                    <TableCell>{padrinosMap.get(apad.id_padrino) || "N/A"}</TableCell>
                    <TableCell>{apad.tipo_apadrinamiento}</TableCell>
                    <TableCell>{new Date(apad.fecha_inicio).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {apad.fecha_fin ? new Date(apad.fecha_fin).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={apad.estado_apadrinamiento_registro === "Activo" ? "default" : "outline"}>
                        {apad.estado_apadrinamiento_registro}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{apad.entregas_ids.length}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay apadrinamientos registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
