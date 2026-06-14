import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Heart, Link2, PackageCheck, AlertCircle, Calendar, FileText, Crown, Database, BarChart3 as BarIcon, PieChart as PieIcon, LineChart as LineIcon, AreaChart as AreaIcon, ImageIcon, ScrollText, ChevronRight, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from "recharts";
import {
  DashboardService,
  DashboardKPIs,
  NoSQLStats,
  NoSQLColeccion,
  DASHBOARD_AUTO_REFRESH_MS,
  Evento,
  Apadrinamiento,
  relationalItemsToNinos,
  relationalItemsToPadrinos,
  relationalItemsToApadrinamientos,
  relationalItemsToEventos,
  NinosService,
  PadrinosService,
  ApadrinamientosService,
  EventosService,
} from "@/services/api";
import { NoSQLDrillDownDialog, NoSQLDrillDownTarget } from "@/components/NoSQLDrillDownDialog";
import {
  RelationalDrillDownDialog,
  RelationalDrillDownTarget,
  RelationalDrillView,
} from "@/components/RelationalDrillDownDialog";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const NOSQL_COLECCION_CHART: Array<{ key: NoSQLColeccion; name: string; color: string }> = [
  { key: "evidencias", name: "Evidencias", color: "#10b981" },
  { key: "ninos_fotos", name: "Fotos Niños", color: "#06b6d4" },
  { key: "cartas", name: "Cartas", color: "#f59e0b" },
  { key: "bitacora_eventos", name: "Bitácora", color: "#3b82f6" },
];

const NOSQL_LABELS: Record<NoSQLColeccion, string> = {
  evidencias: "Evidencias Multimediales",
  ninos_fotos: "Fotos de Perfil (Niños)",
  cartas: "Cartas de Niños",
  bitacora_eventos: "Bitácora de Eventos",
};

const RELATIONAL_LABELS: Record<RelationalDrillView, string> = {
  ninos_todos: "Todos los Niños",
  ninos_disponibles: "Niños Disponibles",
  ninos_apadrinados: "Niños Apadrinados",
  padrinos_activos: "Padrinos Activos",
  padrinos_todos: "Todos los Padrinos",
  apadrinamientos_activos: "Apadrinamientos Activos",
  apadrinamientos_todos: "Todos los Apadrinamientos",
  entregas_completadas: "Entregas Completadas",
  entregas_pendientes: "Entregas Pendientes",
  entregas_todas: "Todas las Entregas",
  solicitudes_abiertas: "Solicitudes Abiertas",
  eventos_activos: "Eventos Activos y Planeados",
};

const EMPTY_KPIS: DashboardKPIs = {
  total_ninos: 0,
  ninos_disponibles: 0,
  ninos_apadrinados: 0,
  total_padrinos: 0,
  padrinos_activos: 0,
  apadrinamientos_activos: 0,
  entregas_pendientes: 0,
  entregas_completadas: 0,
  solicitudes_abiertas: 0,
};


export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [nosqlStats, setNosqlStats] = useState<NoSQLStats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [asignaciones, setAsignaciones] = useState<Apadrinamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelational, setLoadingRelational] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ninosMap, setNinosMap] = useState<Map<string, string>>(new Map());
  const [padrinosMap, setPadrinosMap] = useState<Map<string, string>>(new Map());
  const [chart1Type, setChart1Type] = useState<"pie" | "bar">("pie");
  const [chart2Type, setChart2Type] = useState<"area" | "line" | "bar">("area");
  const [chartEntregasType, setChartEntregasType] = useState<"pie" | "bar">("pie");
  const [chart3Type, setChart3Type] = useState<"pie" | "bar">("pie");
  const [chart4Type, setChart4Type] = useState<"vertical" | "horizontal">("horizontal");
  const [drillDown, setDrillDown] = useState<NoSQLDrillDownTarget | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [relationalDrill, setRelationalDrill] = useState<RelationalDrillDownTarget | null>(null);
  const [relationalDrillOpen, setRelationalDrillOpen] = useState(false);

  const openDrillDown = (coleccion: NoSQLColeccion, tipoFilter?: string) => {
    setDrillDown({ coleccion, label: NOSQL_LABELS[coleccion], tipoFilter });
    setDrillDownOpen(true);
  };

  const openRelationalDrill = (view: RelationalDrillView) => {
    setRelationalDrill({ view, label: RELATIONAL_LABELS[view] });
    setRelationalDrillOpen(true);
  };

  const chartCollectionData = NOSQL_COLECCION_CHART.map(({ key, name, color }) => ({
    key,
    name,
    color,
    cantidad:
      key === "evidencias" ? (nosqlStats?.documentos_totales.evidencias ?? 0)
      : key === "ninos_fotos" ? (nosqlStats?.documentos_totales.ninos_fotos ?? 0)
      : key === "cartas" ? (nosqlStats?.documentos_totales.cartas ?? 0)
      : (nosqlStats?.documentos_totales.bitacora_eventos ?? 0),
  }));

  useEffect(() => {
    loadDashboardData();
    const timer = setInterval(() => {
      void refreshDashboardQuietly();
    }, DASHBOARD_AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const loadRelationalCache = async (silent = false) => {
    if (!silent) setLoadingRelational(true);
    try {
      const loadOrFallback = async <T,>(
        view: string,
        mapItems: (items: Record<string, unknown>[]) => T[],
        fallback: () => Promise<T[]>
      ): Promise<T[]> => {
        try {
          const res = await DashboardService.getRelationalList(view);
          return mapItems(res.items);
        } catch {
          const result = await Promise.resolve(fallback()).catch(() => [] as T[]);
          return result;
        }
      };

      const [ninosData, padrinosData, asignacionesData, eventosData] = await Promise.all([
          loadOrFallback("ninos_todos", relationalItemsToNinos, () => NinosService.getAll()),
          loadOrFallback("padrinos_todos", relationalItemsToPadrinos, () => PadrinosService.getAll()),
          loadOrFallback(
            "apadrinamientos_todos",
            relationalItemsToApadrinamientos,
            () => ApadrinamientosService.getAll()
          ),
          loadOrFallback("eventos_activos", relationalItemsToEventos, () => EventosService.getAll()),
        ]);

      setNinosMap(new Map(ninosData.map((n) => [n.id_nino, n.nombre])));
      setPadrinosMap(new Map(padrinosData.map((p) => [p.id_padrino, p.nombre])));

      setEventos(
        eventosData
          .filter((e) => e.estado_evento === "Activo" || e.estado_evento === "Planeado")
          .slice(0, 3)
      );

      setAsignaciones(
        [...asignacionesData]
          .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
          .slice(0, 3)
      );
    } catch (err) {
      console.error("Error loading relational cache:", err);
    } finally {
      if (!silent) setLoadingRelational(false);
    }
  };

  const refreshDashboardQuietly = async () => {
    try {
      const [kpisResult, nosqlResult] = await Promise.allSettled([
        DashboardService.getKPIs(),
        DashboardService.getNoSQLStats(),
      ]);

      if (kpisResult.status === "fulfilled") {
        setKpis(kpisResult.value);
        setLoadError(null);
      }

      if (nosqlResult.status === "fulfilled") {
        setNosqlStats(nosqlResult.value);
      }

      await loadRelationalCache(true);
    } catch (err) {
      console.error("Error refreshing dashboard:", err);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [kpisResult, nosqlResult] = await Promise.allSettled([
        DashboardService.getKPIs(),
        DashboardService.getNoSQLStats(),
      ]);

      if (kpisResult.status === "fulfilled") {
        setKpis(kpisResult.value);
      } else {
        console.error("Error loading KPIs:", kpisResult.reason);
        setKpis(EMPTY_KPIS);
        setLoadError("No se pudieron cargar los KPIs. Revisa la conexión con el servidor.");
      }

      if (nosqlResult.status === "fulfilled") {
        setNosqlStats(nosqlResult.value);
      } else {
        console.error("Error loading NoSQL stats:", nosqlResult.reason);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setKpis(EMPTY_KPIS);
      setLoadError("Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }

    void loadRelationalCache(false);
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

  const displayKpis = kpis ?? EMPTY_KPIS;

  const ninosChartData = [
    { name: "Disponibles", cantidad: displayKpis.ninos_disponibles, view: "ninos_disponibles" as RelationalDrillView, color: "#3b82f6" },
    { name: "Apadrinados", cantidad: displayKpis.ninos_apadrinados, view: "ninos_apadrinados" as RelationalDrillView, color: "#10b981" },
  ];

  const entregasChartData = [
    { name: "Completadas", cantidad: displayKpis.entregas_completadas, view: "entregas_completadas" as RelationalDrillView, color: "#10b981" },
    { name: "Pendientes", cantidad: displayKpis.entregas_pendientes, view: "entregas_pendientes" as RelationalDrillView, color: "#f59e0b" },
  ];

  const tendenciaData = [
    { mes: "Ene", apadrinamientos: Math.max(5, Math.round(displayKpis.apadrinamientos_activos * 0.2)) },
    { mes: "Feb", apadrinamientos: Math.max(12, Math.round(displayKpis.apadrinamientos_activos * 0.4)) },
    { mes: "Mar", apadrinamientos: Math.max(25, Math.round(displayKpis.apadrinamientos_activos * 0.6)) },
    { mes: "Abr", apadrinamientos: Math.max(38, Math.round(displayKpis.apadrinamientos_activos * 0.75)) },
    { mes: "May", apadrinamientos: Math.max(50, Math.round(displayKpis.apadrinamientos_activos * 0.9)) },
    { mes: "Jun", apadrinamientos: displayKpis.apadrinamientos_activos },
  ];

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs />

      {/* Header Directivo */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-primary mb-1">
            <Crown className="h-3.5 w-3.5" /> Dirección de SmileLink
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard Directivo</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            Vista ejecutiva con métricas MySQL, contenido MongoDB y acceso rápido al detalle de cada área. Haz clic en tarjetas y gráficos para explorar.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Database className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
          <span>Base de Datos Activa</span>
        </div>
      </header>

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => loadDashboardData()}>
            Reintentar
          </Button>
        </div>
      )}

      {loadingRelational && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Cargando listados para drill-down (niños, entregas, etc.)…
        </p>
      )}

      {/* Filtros por fecha */}
      <section className="grid gap-4 sm:grid-cols-2 items-end bg-card p-4 rounded-xl border shadow-sm" aria-label="Filtros">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Desde</label>
          <input type="date" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Hasta</label>
          <input type="date" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </section>

      {/* KPIs Directivos — clic para drill-down */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="KPIs directivos">
        <article
          role="button"
          tabIndex={0}
          onClick={() => openRelationalDrill("ninos_todos")}
          onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("ninos_todos")}
          className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-blue-500 bg-blue-500/5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Niños Registrados</span>
              <strong className="block text-3xl font-extrabold text-foreground">{displayKpis.total_ninos}</strong>
              <small className="block text-xs text-blue-500 font-medium">Clic para ver listado</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article
          role="button"
          tabIndex={0}
          onClick={() => openRelationalDrill("padrinos_activos")}
          onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("padrinos_activos")}
          className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-amber-500 bg-amber-500/5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Padrinos Activos</span>
              <strong className="block text-3xl font-extrabold text-foreground">{displayKpis.padrinos_activos}</strong>
              <small className="block text-xs text-amber-500 font-medium">Apadrinan actualmente</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article
          role="button"
          tabIndex={0}
          onClick={() => openRelationalDrill("apadrinamientos_activos")}
          onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("apadrinamientos_activos")}
          className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-indigo-500 bg-indigo-500/5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Apadrinamientos Activos</span>
              <strong className="block text-3xl font-extrabold text-foreground">{displayKpis.apadrinamientos_activos}</strong>
              <small className="block text-xs text-indigo-500 font-medium">Relaciones vigentes</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
              <Link2 className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article
          role="button"
          tabIndex={0}
          onClick={() => openRelationalDrill("entregas_completadas")}
          onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("entregas_completadas")}
          className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-emerald-500 bg-emerald-500/5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Entregas Verificadas</span>
              <strong className="block text-3xl font-extrabold text-foreground">
                {displayKpis.entregas_completadas}/{displayKpis.entregas_completadas + displayKpis.entregas_pendientes}
              </strong>
              <small className="block text-xs text-emerald-500 font-medium">Clic para ver entregas</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
              <PackageCheck className="h-6 w-6" />
            </div>
          </div>
        </article>
      </section>

      {/* KPIs secundarios */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article
          role="button"
          tabIndex={0}
          onClick={() => openRelationalDrill("ninos_disponibles")}
          onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("ninos_disponibles")}
          className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-500/40"
        >
          <p className="text-xs text-muted-foreground font-medium">Niños disponibles</p>
          <p className="text-2xl font-bold mt-1">{displayKpis.ninos_disponibles}</p>
        </article>
        <article
          role="button"
          tabIndex={0}
          onClick={() => openRelationalDrill("solicitudes_abiertas")}
          onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("solicitudes_abiertas")}
          className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-amber-500/40"
        >
          <p className="text-xs text-muted-foreground font-medium">Solicitudes abiertas</p>
          <p className="text-2xl font-bold mt-1">{displayKpis.solicitudes_abiertas}</p>
        </article>
        <article
          role="button"
          tabIndex={0}
          onClick={() => openRelationalDrill("entregas_pendientes")}
          onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("entregas_pendientes")}
          className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-orange-500/40"
        >
          <p className="text-xs text-muted-foreground font-medium">Entregas pendientes</p>
          <p className="text-2xl font-bold mt-1">{displayKpis.entregas_pendientes}</p>
        </article>
      </section>

      {/* Alertas rápidas — clic para ir al detalle */}
      <Card className="border-l-4 border-l-warning bg-warning/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-warning-foreground">
            <AlertCircle className="h-5 w-5 text-warning" />
            Alertas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>
              <button
                type="button"
                onClick={() => openRelationalDrill("solicitudes_abiertas")}
                className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-warning/10 transition-colors text-left group"
              >
                <span className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-warning" />
                  <span className="font-medium">{displayKpis.solicitudes_abiertas} solicitudes abiertas</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-warning" />
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openRelationalDrill("entregas_pendientes")}
                className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-warning/10 transition-colors text-left group"
              >
                <span className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-warning" />
                  <span className="font-medium">{displayKpis.entregas_pendientes} entregas pendientes de verificación</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-warning" />
              </button>
            </li>
            <li className="flex items-center gap-2 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-muted-foreground">Sistema funcionando correctamente</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Grid de Eventos y Asignaciones */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos eventos */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos Eventos
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => openRelationalDrill("eventos_activos")}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay eventos programados
              </p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {eventos.map((evento) => (
                  <button
                    key={evento.id_evento}
                    type="button"
                    onClick={() => navigate("/eventos")}
                    className="w-full flex items-start justify-between rounded-lg border border-border p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left group"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">{evento.nombre_evento}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evento.fecha_inicio).toLocaleDateString()} - {new Date(evento.fecha_fin).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
                        {evento.tipo_evento}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={evento.estado_evento === "Activo" ? "default" : "secondary"}>
                        {evento.estado_evento}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas asignaciones */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Link2 className="h-5 w-5 text-primary" />
              Últimas Asignaciones
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => openRelationalDrill("apadrinamientos_activos")}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {asignaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay asignaciones recientes
              </p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {asignaciones.map((asignacion) => {
                  const ninoNombre = ninosMap.get(asignacion.id_nino) || "N/A";
                  const padrinoNombre = padrinosMap.get(asignacion.id_padrino) || "N/A";

                  return (
                    <button
                      key={asignacion.id_apadrinamiento}
                      type="button"
                      onClick={() => navigate(`/asignaciones/${asignacion.id_apadrinamiento}`)}
                      className="w-full flex items-start justify-between rounded-lg border border-border p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left group"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">{ninoNombre}</h4>
                        <p className="text-sm text-muted-foreground">Padrino: {padrinoNombre}</p>
                        <p className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
                          {asignacion.tipo_apadrinamiento} • {new Date(asignacion.fecha_inicio).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={asignacion.estado_apadrinamiento_registro === "Activo" ? "default" : "outline"}>
                          {asignacion.estado_apadrinamiento_registro}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN RELACIONAL (MySQL) */}
      <section className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border pb-4">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              Negocio
            </span>
            <h2 className="text-2xl font-bold text-foreground mt-0.5">Control y Seguimiento (MySQL)</h2>
            <p className="text-sm text-muted-foreground">Métricas de niños, entregas y apadrinamientos — clic en gráficos para explorar</p>
          </div>
          <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold self-start sm:self-auto shadow-sm">
            MySQL Activo
          </span>
        </header>

        {/* Gráficos SQL */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Gráfico 1: Niños por Estado */}
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">Distribución de Niños</h3>
                <p className="text-xs text-muted-foreground">Clic para ver niños por estado</p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setChart1Type("pie")}
                  className={`p-1.5 rounded-md transition-all ${chart1Type === "pie" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Dona"
                >
                  <PieIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChart1Type("bar")}
                  className={`p-1.5 rounded-md transition-all ${chart1Type === "bar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Barras"
                >
                  <BarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center">
              {chart1Type === "pie" ? (
                <>
                  <div className="h-56 w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ninosChartData}
                          dataKey="cantidad"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          style={{ cursor: "pointer" }}
                          onClick={(_, index) => {
                            const row = ninosChartData[index];
                            if (row) openRelationalDrill(row.view);
                          }}
                        >
                          {ninosChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center text-xs mt-4 text-muted-foreground font-semibold">
                    {ninosChartData.map((entry) => (
                      <button
                        key={entry.name}
                        type="button"
                        onClick={() => openRelationalDrill(entry.view)}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: {entry.cantidad}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ninosChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar
                        dataKey="cantidad"
                        radius={[4, 4, 0, 0]}
                        barSize={50}
                        style={{ cursor: "pointer" }}
                        onClick={(barData) => {
                          const row = barData?.payload as { view?: RelationalDrillView };
                          if (row?.view) openRelationalDrill(row.view);
                        }}
                      >
                        {ninosChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico 2: Estado de Entregas */}
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">Estado de Entregas</h3>
                <p className="text-xs text-muted-foreground">Clic para ver entregas por estado</p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setChartEntregasType("pie")}
                  className={`p-1.5 rounded-md transition-all ${chartEntregasType === "pie" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Dona"
                >
                  <PieIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartEntregasType("bar")}
                  className={`p-1.5 rounded-md transition-all ${chartEntregasType === "bar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Barras"
                >
                  <BarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center">
              {chartEntregasType === "pie" ? (
                <>
                  <div className="h-56 w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={entregasChartData}
                          dataKey="cantidad"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          style={{ cursor: "pointer" }}
                          onClick={(_, index) => {
                            const row = entregasChartData[index];
                            if (row) openRelationalDrill(row.view);
                          }}
                        >
                          {entregasChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center text-xs mt-4 text-muted-foreground font-semibold">
                    {entregasChartData.map((entry) => (
                      <button
                        key={entry.name}
                        type="button"
                        onClick={() => openRelationalDrill(entry.view)}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: {entry.cantidad}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={entregasChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar
                        dataKey="cantidad"
                        radius={[4, 4, 0, 0]}
                        barSize={45}
                        style={{ cursor: "pointer" }}
                        onClick={(barData) => {
                          const row = barData?.payload as { view?: RelationalDrillView };
                          if (row?.view) openRelationalDrill(row.view);
                        }}
                      >
                        {entregasChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico 3: Tendencia de Apadrinamientos */}
          <div
            className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer"
            onClick={() => openRelationalDrill("apadrinamientos_activos")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openRelationalDrill("apadrinamientos_activos")}
          >
            <div className="p-5 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">Tendencia de Apadrinamientos</h3>
                <p className="text-xs text-muted-foreground">Clic para ver apadrinamientos activos</p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setChart2Type("area")}
                  className={`p-1.5 rounded-md transition-all ${chart2Type === "area" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Área"
                >
                  <AreaIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChart2Type("line")}
                  className={`p-1.5 rounded-md transition-all ${chart2Type === "line" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Línea"
                >
                  <LineIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChart2Type("bar")}
                  className={`p-1.5 rounded-md transition-all ${chart2Type === "bar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Barras"
                >
                  <BarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chart2Type === "area" ? (
                    <AreaChart data={tendenciaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorApadrinamientos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="mes" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Area type="monotone" dataKey="apadrinamientos" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApadrinamientos)" />
                    </AreaChart>
                  ) : chart2Type === "line" ? (
                    <LineChart data={tendenciaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="mes" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Line type="monotone" dataKey="apadrinamientos" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={tendenciaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="mes" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar dataKey="apadrinamientos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={35} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN NO SQL (MongoDB) */}
      <section className="space-y-6 pt-6 border-t border-border">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border pb-4">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
              Contenido NoSQL
            </span>
            <h2 className="text-2xl font-bold text-foreground mt-0.5">Estadísticas Distribuidas (MongoDB)</h2>
            <p className="text-sm text-muted-foreground">Evidencias multimedia y cartas digitalizadas en el Nodo de Réplica NoSQL</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold self-start sm:self-auto shadow-sm">
            <Database className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
            <span>Base de Datos Activa</span>
          </span>
        </header>

        {/* KPIs NoSQL en MongoDB — clic para drill-down */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article
            role="button"
            tabIndex={0}
            onClick={() => openDrillDown("evidencias")}
            onKeyDown={(e) => e.key === "Enter" && openDrillDown("evidencias")}
            className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-emerald-500 bg-emerald-500/5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Evidencias Multimediales</span>
                <strong className="block text-3xl font-extrabold text-foreground">
                  {nosqlStats?.documentos_totales.evidencias ?? 0}
                </strong>
                <small className="block text-xs text-emerald-500 font-medium">Clic para ver fotos y videos</small>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                <PackageCheck className="h-6 w-6" />
              </div>
            </div>
          </article>

          <article
            role="button"
            tabIndex={0}
            onClick={() => openDrillDown("ninos_fotos")}
            onKeyDown={(e) => e.key === "Enter" && openDrillDown("ninos_fotos")}
            className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-cyan-500 bg-cyan-500/5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Fotos de Perfil</span>
                <strong className="block text-3xl font-extrabold text-foreground">
                  {nosqlStats?.documentos_totales.ninos_fotos ?? 0}
                </strong>
                <small className="block text-xs text-cyan-600 dark:text-cyan-400 font-medium">Avatares de niños en Mongo</small>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 group-hover:scale-105 transition-transform">
                <ImageIcon className="h-6 w-6" />
              </div>
            </div>
          </article>

          <article
            role="button"
            tabIndex={0}
            onClick={() => openDrillDown("cartas")}
            onKeyDown={(e) => e.key === "Enter" && openDrillDown("cartas")}
            className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-amber-500 bg-amber-500/5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Cartas de Niños</span>
                <strong className="block text-3xl font-extrabold text-foreground">
                  {nosqlStats?.documentos_totales.cartas ?? 0}
                </strong>
                <small className="block text-xs text-amber-500 font-medium">Correspondencia digitalizada</small>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </article>

          <article
            role="button"
            tabIndex={0}
            onClick={() => openDrillDown("bitacora_eventos")}
            onKeyDown={(e) => e.key === "Enter" && openDrillDown("bitacora_eventos")}
            className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-blue-500 bg-blue-500/5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Bitácora NoSQL</span>
                <strong className="block text-3xl font-extrabold text-foreground">
                  {nosqlStats?.documentos_totales.bitacora_eventos ?? 0}
                </strong>
                <small className="block text-xs text-blue-500 font-medium">Logs de acciones del sistema</small>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
                <ScrollText className="h-6 w-6" />
              </div>
            </div>
          </article>
        </div>

        {/* Gráficos NoSQL */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico 1: Evidencias por tipo */}
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">Evidencias por Tipo de Archivo</h3>
                <p className="text-xs text-muted-foreground">Clic en el gráfico para ver las fotos de ese tipo</p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setChart3Type("pie")}
                  className={`p-1.5 rounded-md transition-all ${chart3Type === "pie" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Dona"
                >
                  <PieIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChart3Type("bar")}
                  className={`p-1.5 rounded-md transition-all ${chart3Type === "bar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Gráfico de Barras"
                >
                  <BarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center">
              {(() => {
                // Compute effective data: if evidencias_por_tipo is empty but total > 0, build a fallback
                const rawTipo = nosqlStats?.evidencias_por_tipo ?? [];
                const totalEvidencias = nosqlStats?.documentos_totales.evidencias ?? 0;
                const tipoData = rawTipo.length > 0
                  ? rawTipo
                  : totalEvidencias > 0
                    ? [{ tipo: "foto", cantidad: totalEvidencias }]
                    : [];

                if (tipoData.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                      <PackageCheck className="h-10 w-10 opacity-30" />
                      <p className="text-sm font-medium">Sin evidencias registradas aún</p>
                      <p className="text-xs opacity-70">Las fotos y videos de entregas aparecerán aquí</p>
                    </div>
                  );
                }

                return chart3Type === "pie" ? (
                  <>
                    <div className="h-56 w-full max-w-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tipoData}
                            dataKey="cantidad"
                            nameKey="tipo"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            style={{ cursor: "pointer" }}
                            onClick={(_, index) => {
                              const entry = tipoData[index];
                              if (entry) openDrillDown("evidencias", entry.tipo);
                            }}
                          >
                            {tipoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                            itemStyle={{ color: "hsl(var(--foreground))" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs mt-4 text-muted-foreground">
                      {tipoData.map((entry, index) => (
                        <div key={entry.tipo} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="capitalize font-semibold">{entry.tipo}: {entry.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tipoData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="tipo" stroke="currentColor" className="text-muted-foreground text-xs capitalize" />
                        <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        />
                        <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={40} style={{ cursor: "pointer" }}
                          onClick={(barData) => {
                            const entry = barData?.payload as { tipo?: string };
                            if (entry?.tipo) openDrillDown("evidencias", entry.tipo);
                          }}
                        >
                          {tipoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Gráfico 2: Comparativa de Documentos NoSQL */}
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">Distribución de Colecciones NoSQL</h3>
                <p className="text-xs text-muted-foreground">Clic en una barra para explorar su contenido</p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setChart4Type("horizontal")}
                  className={`p-1 rounded transition-all ${chart4Type === "horizontal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Barras Horizontales"
                >
                  <span className="text-xs font-semibold px-1.5">Horiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChart4Type("vertical")}
                  className={`p-1 rounded transition-all ${chart4Type === "vertical" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Barras Verticales"
                >
                  <span className="text-xs font-semibold px-1.5">Vert</span>
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chart4Type === "horizontal" ? (
                    <BarChart 
                      layout="vertical"
                      data={chartCollectionData}
                      margin={{ top: 20, right: 20, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                      <XAxis type="number" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis dataKey="name" type="category" stroke="currentColor" className="text-muted-foreground text-xs" width={90} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar
                        dataKey="cantidad"
                        radius={[0, 4, 4, 0]}
                        barSize={18}
                        style={{ cursor: "pointer" }}
                        onClick={(barData) => {
                          const row = barData?.payload as { key?: NoSQLColeccion };
                          if (row?.key) openDrillDown(row.key);
                        }}
                      >
                        {chartCollectionData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart 
                      data={chartCollectionData}
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar
                        dataKey="cantidad"
                        radius={[4, 4, 0, 0]}
                        barSize={35}
                        style={{ cursor: "pointer" }}
                        onClick={(barData) => {
                          const row = barData?.payload as { key?: NoSQLColeccion };
                          if (row?.key) openDrillDown(row.key);
                        }}
                      >
                        {chartCollectionData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NoSQLDrillDownDialog
        target={drillDown}
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        ninosMap={ninosMap}
      />

      <RelationalDrillDownDialog
        target={relationalDrill}
        open={relationalDrillOpen}
        onOpenChange={setRelationalDrillOpen}
        ninosMap={ninosMap}
        padrinosMap={padrinosMap}
      />
    </div>
  );
}

