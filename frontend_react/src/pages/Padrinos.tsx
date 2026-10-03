import { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, ShieldCheck, ShieldAlert,
  CheckCircle2, AlertTriangle, RefreshCw, XCircle, Bot,
  Camera, ExternalLink, UserCheck, Clock, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PadrinosService, Padrino } from "@/services/api";

interface VerificacionModalData {
  padrino_id: string;
  nombre: string;
  email: string;
  puede_apadrinar: boolean;
  estado_verificacion: string;
  motivo_rechazo: string;
  foto_ine_url: string;
  foto_rostro_url: string;
  ia_sospecha: boolean;
  ia_reporte: any;
  fecha_verificacion: string | null;
}

export default function Padrinos() {
  const navigate = useNavigate();
  const [padrinos, setPadrinos] = useState<Padrino[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("por_revisar");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [padrinoToDelete, setPadrinoToDelete] = useState<string | null>(null);

  // Estados para el Modal de Verificación
  const [verifModalOpen, setVerifModalOpen] = useState(false);
  const [loadingVerif, setLoadingVerif] = useState(false);
  const [verifData, setVerifData] = useState<VerificacionModalData | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [showMotivoInput, setShowMotivoInput] = useState<"reintento" | "rechazo" | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");

  useEffect(() => {
    loadPadrinos();
  }, []);

  const loadPadrinos = async () => {
    try {
      setLoading(true);
      const data = await PadrinosService.getAll();
      setPadrinos(data);
    } catch (err) {
      toast.error("Error al cargar los padrinos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado y partición por pestañas (memoizado para evitar re-cálculos en cada render)
  const padrinosPorRevisar = useMemo(() =>
    padrinos.filter(
      (p) => !p.puede_apadrinar || p.estado_verificacion === "Pendiente" || p.estado_verificacion === "Requiere_Reintento"
    ), [padrinos]
  );

  const padrinosDeAlta = useMemo(() =>
    padrinos.filter(
      (p) => p.puede_apadrinar && p.estado_verificacion === "Aprobado"
    ), [padrinos]
  );

  const currentList = activeTab === "por_revisar" ? padrinosPorRevisar : padrinosDeAlta;

  const filteredPadrinos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return currentList;
    return currentList.filter((p) =>
      p.nombre.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.id_padrino.toLowerCase().includes(term)
    );
  }, [currentList, searchTerm]);

  // Abrir Modal de Verificación y cargar fotos desde Supabase
  const handleAbrirVerificacion = async (id: string) => {
    try {
      setLoadingVerif(true);
      setVerifModalOpen(true);
      setShowMotivoInput(null);
      setMotivoTexto("");

      const data = await PadrinosService.getVerificacion(id);
      setVerifData({
        padrino_id: String(data.padrino_id ?? id),
        nombre: data.nombre,
        email: data.email,
        puede_apadrinar: data.puede_apadrinar,
        estado_verificacion: data.estado_verificacion,
        motivo_rechazo: data.motivo_rechazo || "",
        foto_ine_url: data.foto_ine_url || "",
        foto_rostro_url: data.foto_rostro_url || "",
        ia_sospecha: Boolean(data.ia_sospecha),
        ia_reporte: data.ia_reporte || {},
        fecha_verificacion: data.fecha_verificacion,
      });
    } catch (err) {
      toast.error("No se pudieron cargar los datos de verificación");
      setVerifModalOpen(false);
    } finally {
      setLoadingVerif(false);
    }
  };

  // Resolver Verificación (Aprobar, Solicitar Reintento, Rechazar)
  const handleResolverVerificacion = async (
    accion: "aprobar" | "rechazar" | "solicitar_reintento",
    motivoManual?: string
  ) => {
    if (!verifData) return;

    const motivo = motivoManual ?? motivoTexto;

    if ((accion === "rechazar" || accion === "solicitar_reintento") && !motivo.trim()) {
      toast.warning("Por favor escribe un mensaje o motivo para el padrino.");
      return;
    }

    try {
      setActionProcessing(true);
      await PadrinosService.resolverVerificacion(verifData.padrino_id, {
        accion,
        motivo: motivo.trim(),
      });

      if (accion === "aprobar") {
        toast.success("¡Padrino aprobado exitosamente! Ahora puede ver y apadrinar niños.");
      } else if (accion === "solicitar_reintento") {
        toast.info("Se ha solicitado al padrino que vuelva a tomar su fotografía.");
      } else {
        toast.error("El registro del padrino ha sido rechazado.");
      }

      setVerifModalOpen(false);
      await loadPadrinos();
    } catch (err) {
      toast.error("Ocurrió un error al procesar la verificación");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    setPadrinoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!padrinoToDelete) return;
    try {
      await PadrinosService.delete(padrinoToDelete);
      toast.success("Padrino eliminado exitosamente");
      setDeleteDialogOpen(false);
      setPadrinoToDelete(null);
      await loadPadrinos();
    } catch (err) {
      toast.error("Error al eliminar padrino");
    }
  };

  // Renderizamos la estructura completa siempre; los skeletons están DENTRO de la tabla
  // para mostrar el layout inmediatamente sin bloquear el render

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Gestión de Padrinos
            <Badge variant="outline" className="text-sm font-normal py-1 px-3 border-primary/30 bg-primary/5">
              Fragmentación Vertical & Verificación IA
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las solicitudes de identidad, inspección de INE/rostro y padrinos autorizados.
          </p>
        </div>
        <Button onClick={() => navigate("/padrinos/nuevo")} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Registrar Padrino
        </Button>
      </div>

      {/* Pestañas de Navegación: Por Revisar vs De Alta */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-card border border-border/60 p-1 shadow-sm h-12">
            <TabsTrigger
              value="por_revisar"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2 font-medium flex items-center gap-2 transition-all"
            >
              <Clock className="h-4 w-4" />
              Por Revisar
              {padrinosPorRevisar.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/30"
                >
                  {padrinosPorRevisar.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="alta"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2 font-medium flex items-center gap-2 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              Padrinos de Alta (Aprobados)
              <Badge
                variant="secondary"
                className="ml-1 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-emerald-500/30"
              >
                {padrinosDeAlta.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Búsqueda rápida */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card/60 border-border/60"
            />
          </div>
        </div>

        {/* CONTENIDO PESTAÑA: POR REVISAR */}
        <TabsContent value="por_revisar" className="space-y-4">
          <Card className="border-amber-500/30 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    Identificaciones Pendientes de Evaluación ({filteredPadrinos.length})
                  </CardTitle>
                  <CardDescription>
                    Los usuarios listados aquí no tienen acceso a ver ni apadrinar niños hasta que apruebes su documentación oficial.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-20 font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Padrino / Donante</TableHead>
                    <TableHead className="font-semibold">Fecha Registro</TableHead>
                    <TableHead className="font-semibold">Estado Verificación</TableHead>
                    <TableHead className="font-semibold">Análisis Forense IA</TableHead>
                    <TableHead className="text-right font-semibold pr-6">Acción Requerida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-36 mb-1" />
                          <Skeleton className="h-3 w-28" />
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                        <TableCell className="text-right pr-6"><Skeleton className="h-8 w-36 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredPadrinos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                        No hay identificaciones pendientes por revisar. ¡Todo al día!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPadrinos.map((padrino) => (
                      <TableRow key={padrino.id_padrino} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                          {padrino.id_padrino}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{padrino.nombre}</div>
                          <div className="text-xs text-muted-foreground font-mono">{padrino.email}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {padrino.fecha_registro}
                        </TableCell>
                        <TableCell>
                          {padrino.estado_verificacion === "Pendiente" && (
                            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1">
                              <Clock className="h-3 w-3" /> Pendiente
                            </Badge>
                          )}
                          {padrino.estado_verificacion === "Requiere_Reintento" && (
                            <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 gap-1">
                              <RefreshCw className="h-3 w-3" /> Reintento Solicitado
                            </Badge>
                          )}
                          {padrino.estado_verificacion === "Rechazado" && (
                            <Badge variant="destructive" className="bg-red-500/15 text-red-500 border-red-500/30 gap-1">
                              <XCircle className="h-3 w-3" /> Rechazado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {padrino.ia_sospecha ? (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/40 gap-1.5 animate-pulse">
                              <Bot className="h-3.5 w-3.5" /> Posible IA Detectada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Metadatos Normales
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            onClick={() => handleAbrirVerificacion(padrino.id_padrino)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-1.5"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Revisar Documentos
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENIDO PESTAÑA: PADRINOS DE ALTA */}
        <TabsContent value="alta" className="space-y-4">
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Padrinos Activos y Autorizados ({filteredPadrinos.length})
              </CardTitle>
              <CardDescription>
                Padrinos cuya identidad ha sido verificada y tienen permiso activo para apadrinar niños.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-20 font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Teléfono</TableHead>
                    <TableHead className="font-semibold">Fecha Registro</TableHead>
                    <TableHead className="font-semibold">Apadrinamientos</TableHead>
                    <TableHead className="text-right font-semibold pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPadrinos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No se encontraron padrinos autorizados con ese criterio.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPadrinos.map((padrino) => (
                      <TableRow key={padrino.id_padrino} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-xs">{padrino.id_padrino}</TableCell>
                        <TableCell className="font-medium text-foreground">{padrino.nombre}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{padrino.email}</TableCell>
                        <TableCell>{padrino.telefono || "N/A"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{padrino.fecha_registro}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold">
                            {padrino.historial_apadrinamiento_ids.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver expediente de verificación"
                              onClick={() => handleAbrirVerificacion(padrino.id_padrino)}
                            >
                              <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver perfil completo"
                              onClick={() => navigate(`/padrinos/${padrino.id_padrino}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => navigate(`/padrinos/${padrino.id_padrino}/editar`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Eliminar"
                              onClick={() => handleDelete(padrino.id_padrino)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE REVISIÓN DE IDENTIDAD (INE + ROSTRO + ANÁLISIS IA) */}
      <Dialog open={verifModalOpen} onOpenChange={setVerifModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Expediente de Verificación de Identidad
            </DialogTitle>
            <DialogDescription>
              Inspecciona las fotos cargadas de forma privada en Supabase y el reporte forense de IA antes de autorizar al usuario.
            </DialogDescription>
          </DialogHeader>

          {loadingVerif ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-8 w-1/2" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ) : verifData ? (
            <div className="space-y-5 py-2">
              {/* Resumen del Usuario */}
              <div className="flex flex-wrap items-center justify-between p-3.5 rounded-lg bg-muted/40 border border-border/60 gap-3">
                <div>
                  <h4 className="font-semibold text-foreground text-base">{verifData.nombre}</h4>
                  <p className="text-xs text-muted-foreground font-mono">{verifData.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal text-xs">
                    ID #{verifData.padrino_id}
                  </Badge>
                  {verifData.puede_apadrinar ? (
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                      Autorizado para Apadrinar
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                      Acceso Bloqueado (Sin Autorizar)
                    </Badge>
                  )}
                </div>
              </div>

              {/* SECCIÓN FORENSE / ALERTA DE INTELIGENCIA ARTIFICIAL */}
              {verifData.ia_sospecha ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-red-400">
                    <Bot className="h-5 w-5 text-red-500 animate-bounce" />
                    <span>⚠️ ALERTA DE SEGURIDAD: FOTOGRAFÍA GENERADA CON INTELIGENCIA ARTIFICIAL</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-red-300">
                    El analizador de metadatos forenses ha detectado firmas, chunks de prompts o ausencia total de cámara física en las imágenes proporcionadas.
                  </p>
                  {verifData.ia_reporte && verifData.ia_reporte.motivos && (
                    <ul className="text-xs list-disc list-inside space-y-1 bg-red-950/30 p-2.5 rounded border border-red-500/20 font-mono">
                      {verifData.ia_reporte.motivos.map((m: string, idx: number) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
                  <Camera className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold block text-emerald-300">Metadatos de Cámara Física Consistentes</span>
                    No se detectaron firmas de generadores generativos de IA en los archivos.
                  </div>
                </div>
              )}

              {/* FOTOGRAFÍAS: CREDENCIAL INE Y ROSTRO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta 1: Credencial INE */}
                <div className="border border-border/60 rounded-xl overflow-hidden bg-card/60 flex flex-col">
                  <div className="p-3 bg-muted/30 border-b border-border/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      1. Credencial INE (Anverso)
                    </span>
                    {verifData.foto_ine_url && (
                      <a
                        href={verifData.foto_ine_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Ver original <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-center bg-black/10 min-h-[220px]">
                    {verifData.foto_ine_url ? (
                      <img
                        src={verifData.foto_ine_url}
                        alt="Credencial INE"
                        className="max-h-56 max-w-full object-contain rounded-lg shadow-md border border-border/40"
                      />
                    ) : (
                      <div className="text-center p-6 text-muted-foreground text-xs">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500 opacity-60" />
                        No se ha subido fotografía de la INE
                      </div>
                    )}
                  </div>
                </div>

                {/* Tarjeta 2: Fotografía del Rostro (Selfie) */}
                <div className="border border-border/60 rounded-xl overflow-hidden bg-card/60 flex flex-col">
                  <div className="p-3 bg-muted/30 border-b border-border/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-primary" />
                      2. Fotografía del Rostro (Selfie)
                    </span>
                    {verifData.foto_rostro_url && (
                      <a
                        href={verifData.foto_rostro_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Ver original <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-center bg-black/10 min-h-[220px]">
                    {verifData.foto_rostro_url ? (
                      <img
                        src={verifData.foto_rostro_url}
                        alt="Rostro del Padrino"
                        className="max-h-56 max-w-full object-contain rounded-lg shadow-md border border-border/40"
                      />
                    ) : (
                      <div className="text-center p-6 text-muted-foreground text-xs">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500 opacity-60" />
                        No se ha subido fotografía del rostro
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensaje de rechazo previo si existe */}
              {verifData.motivo_rechazo && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
                  <span className="font-semibold text-foreground block mb-0.5">Observación / Mensaje registrado:</span>
                  <p className="text-muted-foreground italic">"{verifData.motivo_rechazo}"</p>
                </div>
              )}

              {/* Formulario desplegable para Solicitar Reintento o Rechazo */}
              {showMotivoInput && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in-50 duration-200">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    {showMotivoInput === "reintento"
                      ? "Mensaje al Padrino: Explica por qué debe volver a tomarse la foto"
                      : "Motivo del Rechazo Definitivo"}
                  </label>
                  <Textarea
                    placeholder={
                      showMotivoInput === "reintento"
                        ? "Ejemplo: La credencial INE se encuentra borrosa o no tiene suficiente luz. Por favor vuelve a tomarla sobre un fondo plano con buena iluminación."
                        : "Ejemplo: La documentación no coincide con los datos del usuario registrado."
                    }
                    value={motivoTexto}
                    onChange={(e) => setMotivoTexto(e.target.value)}
                    rows={3}
                    className="bg-card text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMotivoInput(null)}
                      disabled={actionProcessing}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant={showMotivoInput === "reintento" ? "default" : "destructive"}
                      disabled={actionProcessing || !motivoTexto.trim()}
                      onClick={() =>
                        handleResolverVerificacion(
                          showMotivoInput === "reintento" ? "solicitar_reintento" : "rechazar"
                        )
                      }
                    >
                      {actionProcessing ? "Enviando..." : "Confirmar y Enviar al Padrino"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* BOTONES DE ACCIÓN PARA EL ADMINISTRADOR */}
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setVerifModalOpen(false)}
              disabled={actionProcessing}
              className="sm:mr-auto"
            >
              Cerrar
            </Button>

            {!showMotivoInput && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowMotivoInput("reintento")}
                  disabled={actionProcessing}
                  className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10 gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Solicitar Reintento (Foto mal tomada)
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowMotivoInput("rechazo")}
                  disabled={actionProcessing}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </Button>

                <Button
                  onClick={() => handleResolverVerificacion("aprobar")}
                  disabled={actionProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobar y Permitir Apadrinar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar padrino?"
        description="Esta acción desactivará al padrino del sistema."
        onConfirm={confirmDelete}
        confirmText="Eliminar"
      />
    </div>
  );
}
