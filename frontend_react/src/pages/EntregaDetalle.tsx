import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Gift, MapPin, CheckCircle, Clock } from "lucide-react";
import { EntregasService, Entrega, PuntosEntregaService, PuntoEntrega, API_BASE_URL } from "@/services/api";

export default function EntregaDetalle() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [entrega, setEntrega] = useState<Entrega | null>(null);
    const [puntoEntrega, setPuntoEntrega] = useState<PuntoEntrega | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (entregaId: string) => {
        try {
            setLoading(true);
            const data = await EntregasService.getById(entregaId);
            setEntrega(data);

            if (data.id_punto_entrega) {
                try {
                    const punto = await PuntosEntregaService.getById(data.id_punto_entrega);
                    setPuntoEntrega(punto);
                } catch (e) {
                    console.error("Error loading delivery point", e);
                }
            }
        } catch (error) {
            toast.error("Error al cargar la entrega");
            navigate("/entregas");
        } finally {
            setLoading(false);
        }
    };

    const getEvidenceUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        // API_BASE_URL incluye /api, necesitamos la raíz
        const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
        return `${baseUrl}${path}`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Breadcrumbs />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!entrega) return null;

    return (
        <div className="space-y-6">
            <Breadcrumbs />

            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/entregas")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Detalle de Entrega</h1>
                    <p className="text-muted-foreground">{entrega.id_entrega}</p>
                </div>
                <div className="ml-auto">
                    <Badge variant={entrega.estado_entrega === "Entregado" ? "default" : "secondary"}>
                        {entrega.estado_entrega}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Información del Regalo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                            <p className="text-lg">{entrega.descripcion_regalo}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Fecha Programada
                                </p>
                                <p>{new Date(entrega.fecha_programada).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Fecha Entrega Real
                                </p>
                                <p>
                                    {entrega.fecha_entrega_real
                                        ? new Date(entrega.fecha_entrega_real).toLocaleDateString()
                                        : "Pendiente"}
                                </p>
                            </div>
                        </div>

                        {entrega.observaciones && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Observaciones</p>
                                    <p>{entrega.observaciones}</p>
                                </div>
                            </>
                        )}

                        {puntoEntrega && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Punto de Entrega
                                    </p>
                                    <p className="font-semibold">{puntoEntrega.nombre_punto}</p>
                                    <p className="text-sm text-muted-foreground">{puntoEntrega.direccion_fisica}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Evidencia de Entrega
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {entrega.evidencia_foto_path ? (
                            <div className="space-y-4">
                                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/50">
                                    <img
                                        src={getEvidenceUrl(entrega.evidencia_foto_path)}
                                        alt="Evidencia de entrega"
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    Foto subida el {entrega.fecha_entrega_real ? new Date(entrega.fecha_entrega_real).toLocaleDateString() : ""}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 bg-muted/20 rounded-lg border border-dashed border-border">
                                <p className="text-muted-foreground">No hay evidencia fotográfica</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
