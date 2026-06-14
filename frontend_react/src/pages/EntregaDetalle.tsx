import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Package, MapPin, User, Heart, Calendar, FileText, Image as ImageIcon, Video, FileDown, Search } from "lucide-react";
import { toast } from "sonner";
import {
  EntregasService,
  Entrega,
  ApadrinamientosService,
  Apadrinamiento,
  PuntosEntregaService,
  PuntoEntrega,
  NinosService,
  Nino,
  PadrinosService,
  Padrino,
} from "@/services/api";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const BACKEND_URL = VITE_API_URL && VITE_API_URL !== "/api"
  ? VITE_API_URL.replace("/api", "")
  : "http://10.66.207.165:8000";

export default function EntregaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [punto, setPunto] = useState<PuntoEntrega | null>(null);
  const [asignacion, setAsignacion] = useState<Apadrinamiento | null>(null);
  const [nino, setNino] = useState<Nino | null>(null);
  const [padrino, setPadrino] = useState<Padrino | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const ent = await EntregasService.getById(id);
      if (!ent) {
        setEntrega(null);
        return;
      }
      setEntrega(ent);

      const [puntoData, asigData] = await Promise.all([
        PuntosEntregaService.getById(ent.id_punto_entrega),
        ApadrinamientosService.getById(ent.id_apadrinamiento),
      ]);

      setPunto(puntoData);
      setAsignacion(asigData);

      if (asigData) {
        const [ninoData, padrinoData] = await Promise.all([
          NinosService.getById(asigData.id_nino),
          PadrinosService.getById(asigData.id_padrino),
        ]);
        setNino(ninoData);
        setPadrino(padrinoData);
      }
    } catch (err) {
      toast.error("Error al cargar detalles de la entrega");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-12 w-1/4" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Entrega no encontrada</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate("/entregas")}>Volver a la lista</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getEstadoBadge = (estado: Entrega["estado_entrega"]) => {
    const variants: Record<Entrega["estado_entrega"], "default" | "secondary" | "destructive"> = {
      "Pendiente": "destructive",
      "En Proceso": "secondary",
      "Entregado": "default",
    };
    return <Badge variant={variants[estado]}>{estado}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/entregas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detalle de Entrega</h1>
            <p className="text-muted-foreground">Control y verificación física del regalo</p>
          </div>
        </div>
        <div className="flex gap-2">
          {entrega.estado_entrega !== "Entregado" && (
            <Button onClick={() => toast.success("Entrega marcada como completada")}>
              Marcar como Entregado
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles del Regalo y Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Descripción del Regalo</p>
              <p className="text-lg font-medium">{entrega.descripcion_regalo}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estado de la Entrega</p>
                <div className="mt-1">{getEstadoBadge(entrega.estado_entrega)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Programada</p>
                <p className="font-medium">{new Date(entrega.fecha_programada).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Entrega Real</p>
                <p className="font-medium">
                  {entrega.fecha_entrega_real 
                    ? new Date(entrega.fecha_entrega_real).toLocaleDateString()
                    : "Aún sin entregar"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Entrega (MySQL)</p>
                <p className="font-mono text-sm font-medium">{entrega.id_entrega}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Observaciones / Notas de Recepción</p>
              <p className="font-medium whitespace-pre-wrap bg-muted/40 p-3 rounded border mt-1">
                {entrega.observaciones || "Sin observaciones adicionales"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación y Vinculación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Punto de Entrega</p>
              <p className="font-medium text-base">{punto?.nombre_punto || "N/A"}</p>
              <p className="text-xs text-muted-foreground">{punto?.direccion_fisica}</p>
            </div>
            <hr />
            <div>
              <p className="text-sm text-muted-foreground">Niño Beneficiario</p>
              <p className="font-medium">{nino?.nombre || "N/A"}</p>
              {nino && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs" 
                  onClick={() => navigate(`/ninos/${nino.id_nino}`)}
                >
                  Ver Perfil
                </Button>
              )}
            </div>
            <hr />
            <div>
              <p className="text-sm text-muted-foreground">Padrino Donante</p>
              <p className="font-medium">{padrino?.nombre || "N/A"}</p>
              <p className="text-xs text-muted-foreground">{padrino?.email}</p>
              {padrino && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs" 
                  onClick={() => navigate(`/padrinos/${padrino.id_padrino}`)}
                >
                  Ver Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Evidencias Multimediales Distribuidas (NoSQL MongoDB)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entrega.evidencias_nosql && entrega.evidencias_nosql.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {entrega.evidencias_nosql.map((ev: any) => {
                const fullUrl = ev.url_archivo.startsWith("http")
                  ? ev.url_archivo
                  : `${BACKEND_URL}/${ev.url_archivo}`;
                return (
                  <Card key={ev._id} className="overflow-hidden border border-border bg-muted/20">
                    <div className="aspect-video bg-black flex items-center justify-center relative group">
                      {ev.tipo === "foto" ? (
                        <div className="relative w-full h-full cursor-pointer group/img" onClick={() => setPreviewImageUrl(fullUrl)}>
                          <img 
                            src={fullUrl} 
                            alt="Evidencia de entrega" 
                            className="w-full h-full object-cover transition-all group-hover/img:brightness-75"
                            onError={(e) => {
                              // Si falla la carga, muestra icono
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <Search className="h-6 w-6 text-white drop-shadow-md" />
                          </div>
                        </div>
                      ) : ev.tipo === "video" ? (
                        <video src={fullUrl} className="w-full h-full object-cover" controls />
                      ) : (
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize">
                          {ev.tipo}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID NoSQL: {ev._id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p><strong>Subido por:</strong> {ev.subido_por}</p>
                        <p><strong>Fecha NoSQL:</strong> {new Date(ev.timestamp).toLocaleString()}</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                          <FileDown className="h-4 w-4" />
                          Descargar Evidencia
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/60 mb-2" />
              <p className="text-muted-foreground">No hay evidencias multimedia registradas en MongoDB para esta entrega.</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Registra la entrega desde la App Móvil para generar evidencias.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-3xl p-1 bg-black/90 border-none overflow-hidden flex items-center justify-center">
          <div className="relative w-full max-h-[80vh] flex items-center justify-center p-2">
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt="Vista previa de evidencia"
                className="max-w-full max-h-[75vh] object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
