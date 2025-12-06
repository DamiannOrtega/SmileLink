import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Users, Heart, Link2, PackageCheck, AlertCircle, Calendar, Bell } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DashboardService,
  DashboardKPIs,
  EventosService,
  Evento,
  ApadrinamientosService,
  Apadrinamiento,
  NinosService,
  PadrinosService,
  EntregasService,
  SolicitudesService
} from "@/services/api";

export default function Dashboard() {
  const location = useLocation();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [asignaciones, setAsignaciones] = useState<Apadrinamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [ninosMap, setNinosMap] = useState<Map<string, string>>(new Map());
  const [padrinosMap, setPadrinosMap] = useState<Map<string, string>>(new Map());
  const [notificaciones, setNotificaciones] = useState<Array<{
    id: string;
    tipo: "info" | "warning" | "success" | "error";
    titulo: string;
    mensaje: string;
    fecha: Date;
  }>>([]);

  // Activar sistema de notificaciones
  useNotifications(true);

  useEffect(() => {
    loadDashboardData();
    checkNotifications();
    
    // Recargar dashboard periódicamente
    const dashboardInterval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Cada 30 segundos
    
    // Verificar notificaciones periódicamente
    const notificationInterval = setInterval(() => {
      checkNotifications();
    }, 60000); // Cada minuto
    
    return () => {
      clearInterval(dashboardInterval);
      clearInterval(notificationInterval);
    };
  }, [location.pathname]);

  const checkNotifications = async () => {
    try {
      const config = JSON.parse(localStorage.getItem("appConfig") || "{}");
      const nuevasNotificaciones: typeof notificaciones = [];

      // Verificar entregas pendientes
      if (config.notifEntregas !== false) {
        const entregas = await EntregasService.getAll().catch(() => []);
        const pendientes = entregas.filter(
          (e) => e.estado_entrega === "Pendiente" || e.estado_entrega === "En Proceso"
        );

        if (pendientes.length > 0) {
          nuevasNotificaciones.push({
            id: "entregas-pendientes",
            tipo: "warning",
            titulo: "Entregas Pendientes",
            mensaje: `Hay ${pendientes.length} entregas pendientes de verificación`,
            fecha: new Date(),
          });
        }
      }

      // Verificar solicitudes abiertas
      if (config.notifCartas !== false) {
        const solicitudes = await SolicitudesService.getAll().catch(() => []);
        const abiertas = solicitudes.filter((s) => s.estado_solicitud === "Abierta");

        if (abiertas.length > 0) {
          nuevasNotificaciones.push({
            id: "solicitudes-abiertas",
            tipo: "info",
            titulo: "Solicitudes Abiertas",
            mensaje: `Hay ${abiertas.length} solicitudes de regalos abiertas`,
            fecha: new Date(),
          });
        }
      }

      // Verificar nuevos apadrinamientos recientes
      if (config.notifNuevos !== false) {
        const apadrinamientos = await ApadrinamientosService.getAll().catch(() => []);
        const recientes = apadrinamientos.filter((a) => {
          const fechaInicio = new Date(a.fecha_inicio);
          const ahora = new Date();
          const horasDiferencia = (ahora.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
          return horasDiferencia < 24 && a.estado_apadrinamiento_registro === "Activo";
        });

        if (recientes.length > 0) {
          nuevasNotificaciones.push({
            id: "nuevos-apadrinamientos",
            tipo: "success",
            titulo: "Nuevos Apadrinamientos",
            mensaje: `${recientes.length} nuevo(s) apadrinamiento(s) en las últimas 24 horas`,
            fecha: new Date(),
          });
        }
      }

      setNotificaciones(nuevasNotificaciones);
    } catch (error) {
      console.error("Error verificando notificaciones:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar KPIs
      const kpisData = await DashboardService.getKPIs();
      setKpis(kpisData);

      // Cargar eventos activos
      const eventosData = await EventosService.getAll();
      const eventosActivos = eventosData.filter(
        e => e.estado_evento === "Activo" || e.estado_evento === "Planeado"
      );
      setEventos(eventosActivos);

      // Cargar catálogos para nombres primero
      const ninosData = await NinosService.getAll();
      const padrinosData = await PadrinosService.getAll();

      setNinosMap(new Map(ninosData.map(n => [n.id_nino, n.nombre])));
      setPadrinosMap(new Map(padrinosData.map(p => [p.id_padrino, p.nombre])));

      // Cargar últimas asignaciones y filtrar huérfanas
      const asignacionesData = await ApadrinamientosService.getAll();
      const ninosIds = new Set(ninosData.map(n => n.id_nino));
      const padrinosIds = new Set(padrinosData.map(p => p.id_padrino));
      
      // Filtrar asignaciones que tienen niño y padrino válidos
      const asignacionesValidas = asignacionesData.filter(
        (asig) => ninosIds.has(asig.id_nino) && padrinosIds.has(asig.id_padrino)
      );
      
      const ultimasAsigs = asignacionesValidas
        .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
        .slice(0, 5);
      setAsignaciones(ultimasAsigs);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema SmileLink</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Niños Registrados"
          value={kpis.total_ninos}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Padrinos Activos"
          value={kpis.padrinos_activos}
          icon={Heart}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Apadrinamientos Activos"
          value={kpis.apadrinamientos_activos}
          icon={Link2}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Entregas Verificadas"
          value={`${kpis.entregas_completadas}/${kpis.entregas_completadas + kpis.entregas_pendientes}`}
          icon={PackageCheck}
        />
      </div>

      {/* Notificaciones y Alertas */}
      {(notificaciones.length > 0 || kpis.entregas_pendientes > 0 || kpis.solicitudes_abiertas > 0) && (
        <Card className="border-l-4 border-l-warning bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-warning" />
              Notificaciones y Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notificaciones.map((notif) => {
                const iconColor = {
                  info: "text-blue-500",
                  warning: "text-warning",
                  success: "text-success",
                  error: "text-destructive",
                }[notif.tipo];

                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <AlertCircle className={`h-5 w-5 ${iconColor} mt-0.5`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notif.titulo}</p>
                      <p className="text-xs text-muted-foreground">{notif.mensaje}</p>
                    </div>
                  </div>
                );
              })}
              
              {notificaciones.length === 0 && (
                <ul className="space-y-2 text-sm">
                  {kpis.solicitudes_abiertas > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      {kpis.solicitudes_abiertas} solicitudes abiertas
                    </li>
                  )}
                  {kpis.entregas_pendientes > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      {kpis.entregas_pendientes} entregas pendientes de verificación
                    </li>
                  )}
                  {kpis.solicitudes_abiertas === 0 && kpis.entregas_pendientes === 0 && (
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Sistema funcionando correctamente
                    </li>
                  )}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay eventos programados
              </p>
            ) : (
              <div className="space-y-4">
                {eventos.map((evento) => (
                  <div key={evento.id_evento} className="flex items-start justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">{evento.nombre_evento}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evento.fecha_inicio).toLocaleDateString()} - {new Date(evento.fecha_fin).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {evento.tipo_evento}
                      </p>
                    </div>
                    <Badge variant={evento.estado_evento === "Activo" ? "default" : "secondary"}>
                      {evento.estado_evento}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas asignaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Últimas Asignaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {asignaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay asignaciones recientes
              </p>
            ) : (
              <div className="space-y-4">
                {asignaciones.map((asignacion) => {
                  const ninoNombre = ninosMap.get(asignacion.id_nino) || "N/A";
                  const padrinoNombre = padrinosMap.get(asignacion.id_padrino) || "N/A";

                  return (
                    <div key={asignacion.id_apadrinamiento} className="flex items-start justify-between rounded-lg border border-border p-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">
                          {ninoNombre}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Padrino: {padrinoNombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asignacion.tipo_apadrinamiento} • {new Date(asignacion.fecha_inicio).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          asignacion.estado_apadrinamiento_registro === "Activo" ? "default" : "outline"
                        }
                      >
                        {asignacion.estado_apadrinamiento_registro}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribución de estados */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Estados de Niños</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Disponibles</span>
                <span className="font-semibold">
                  {kpis.ninos_disponibles} ({Math.round((kpis.ninos_disponibles / kpis.total_ninos) * 100)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-destructive"
                  style={{ width: `${(kpis.ninos_disponibles / kpis.total_ninos) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Apadrinados</span>
                <span className="font-semibold">
                  {kpis.ninos_apadrinados} ({Math.round((kpis.ninos_apadrinados / kpis.total_ninos) * 100)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(kpis.ninos_apadrinados / kpis.total_ninos) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
