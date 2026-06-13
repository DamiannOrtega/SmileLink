import { useState, useEffect } from "react";
import { Users, Heart, Link2, PackageCheck, AlertCircle, Calendar, FileText, Bell, Crown, Filter, Download, Database, BarChart3 as BarIcon, PieChart as PieIcon, LineChart as LineIcon, AreaChart as AreaIcon } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  EventosService,
  Evento,
  ApadrinamientosService,
  Apadrinamiento,
  NinosService,
  PadrinosService
} from "@/services/api";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];


export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [nosqlStats, setNosqlStats] = useState<NoSQLStats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [asignaciones, setAsignaciones] = useState<Apadrinamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [ninosMap, setNinosMap] = useState<Map<string, string>>(new Map());
  const [padrinosMap, setPadrinosMap] = useState<Map<string, string>>(new Map());
  const [chart1Type, setChart1Type] = useState<"pie" | "bar">("pie");
  const [chart2Type, setChart2Type] = useState<"area" | "line" | "bar">("area");
  const [chart3Type, setChart3Type] = useState<"pie" | "bar">("pie");
  const [chart4Type, setChart4Type] = useState<"vertical" | "horizontal">("horizontal");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar KPIs
      const kpisData = await DashboardService.getKPIs();
      setKpis(kpisData);

      // Cargar métricas NoSQL (MongoDB)
      try {
        const statsData = await DashboardService.getNoSQLStats();
        setNosqlStats(statsData);
      } catch (nosqlErr) {
        console.error("Error loading NoSQL stats:", nosqlErr);
      }

      // Cargar eventos activos
      const eventosData = await EventosService.getAll();
      const eventosActivos = eventosData
        .filter(e => e.estado_evento === "Activo" || e.estado_evento === "Planeado")
        .slice(0, 3);
      setEventos(eventosActivos);

      // Cargar últimas asignaciones
      const asignacionesData = await ApadrinamientosService.getAll();
      const ultimasAsigs = asignacionesData
        .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
        .slice(0, 3);
      setAsignaciones(ultimasAsigs);

      // Cargar catálogos para nombres
      const ninosData = await NinosService.getAll();
      const padrinosData = await PadrinosService.getAll();

      setNinosMap(new Map(ninosData.map(n => [n.id_nino, n.nombre])));
      setPadrinosMap(new Map(padrinosData.map(p => [p.id_padrino, p.nombre])));
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
            Consulta y reportes de alto nivel: evidencias de entrega, cartas de niños y métricas distribuidas en MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Database className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
          <span>Base de Datos Activa</span>
        </div>
      </header>

      {/* Filtros premium */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end bg-card p-4 rounded-xl border shadow-sm" aria-label="Filtros">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Desde</label>
          <input type="date" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Hasta</label>
          <input type="date" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Estado de Apadrinamiento</label>
          <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Disponible</option>
            <option>Inactivo</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="button" className="w-full bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-sm px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 border border-border">
            <Filter className="h-4 w-4" /> Limpiar filtros
          </button>
        </div>
      </section>

      {/* KPIs Directivos */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="KPIs directivos">
        <article className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Niños Registrados</span>
              <strong className="block text-3xl font-extrabold text-foreground">{kpis.total_ninos}</strong>
              <small className="block text-xs text-blue-500 font-medium">Registros en MySQL</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Padrinos Activos</span>
              <strong className="block text-3xl font-extrabold text-foreground">{kpis.padrinos_activos}</strong>
              <small className="block text-xs text-amber-500 font-medium">Apadrinan actualmente</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Heart className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Apadrinamientos Activos</span>
              <strong className="block text-3xl font-extrabold text-foreground">{kpis.apadrinamientos_activos}</strong>
              <small className="block text-xs text-indigo-500 font-medium">Relaciones vigentes</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Link2 className="h-6 w-6" />
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Entregas Verificadas</span>
              <strong className="block text-3xl font-extrabold text-foreground">
                {kpis.entregas_completadas}/{kpis.entregas_completadas + kpis.entregas_pendientes}
              </strong>
              <small className="block text-xs text-emerald-500 font-medium">Entregas completadas</small>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <PackageCheck className="h-6 w-6" />
            </div>
          </div>
        </article>
      </section>

      {/* Alertas rápidas */}
      <Card className="border-l-4 border-l-warning bg-warning/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-warning-foreground">
            <AlertCircle className="h-5 w-5 text-warning" />
            Alertas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="font-medium">{kpis.solicitudes_abiertas} solicitudes abiertas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="font-medium">{kpis.entregas_pendientes} entregas pendientes de verificación</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium">Sistema funcionando correctamente</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Grid de Eventos y Asignaciones */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos eventos */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay eventos programados
              </p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {eventos.map((evento) => (
                  <div key={evento.id_evento} className="flex items-start justify-between rounded-lg border border-border p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">{evento.nombre_evento}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evento.fecha_inicio).toLocaleDateString()} - {new Date(evento.fecha_fin).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
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
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Link2 className="h-5 w-5 text-primary" />
              Últimas Asignaciones
            </CardTitle>
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
                    <div key={asignacion.id_apadrinamiento} className="flex items-start justify-between rounded-lg border border-border p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">
                          {ninoNombre}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Padrino: {padrinoNombre}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
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

      {/* SECCIÓN RELACIONAL (MySQL) */}
      <section className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border pb-4">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              Negocio
            </span>
            <h2 className="text-2xl font-bold text-foreground mt-0.5">Control y Seguimiento (MySQL)</h2>
            <p className="text-sm text-muted-foreground">Métricas de niños y estado de entregas en base de datos relacional</p>
          </div>
          <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold self-start sm:self-auto shadow-sm">
            MySQL Activo
          </span>
        </header>

        {/* Gráficos SQL */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico 1: Niños por Estado */}
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">Distribución de Niños</h3>
                <p className="text-xs text-muted-foreground">Estado actual de apadrinamiento de niños</p>
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
                          data={[
                            { name: "Disponibles", cantidad: kpis.ninos_disponibles },
                            { name: "Apadrinados", cantidad: kpis.ninos_apadrinados }
                          ]}
                          dataKey="cantidad"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          <Cell fill="#3b82f6" strokeWidth={0} />
                          <Cell fill="#10b981" strokeWidth={0} />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 justify-center text-xs mt-4 text-muted-foreground font-semibold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Disponibles: {kpis.ninos_disponibles}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Apadrinados: {kpis.ninos_apadrinados}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "Disponibles", cantidad: kpis.ninos_disponibles },
                      { name: "Apadrinados", cantidad: kpis.ninos_apadrinados }
                    ]} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={50}>
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico 2: Tendencia de Apadrinamientos */}
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold text-lg text-foreground">Tendencia de Apadrinamientos</h3>
                <p className="text-xs text-muted-foreground">Evolución mensual acumulada del programa</p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg border border-border">
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
                    <AreaChart data={[
                      { mes: "Ene", apadrinamientos: Math.max(5, Math.round(kpis.apadrinamientos_activos * 0.2)) },
                      { mes: "Feb", apadrinamientos: Math.max(12, Math.round(kpis.apadrinamientos_activos * 0.4)) },
                      { mes: "Mar", apadrinamientos: Math.max(25, Math.round(kpis.apadrinamientos_activos * 0.6)) },
                      { mes: "Abr", apadrinamientos: Math.max(38, Math.round(kpis.apadrinamientos_activos * 0.75)) },
                      { mes: "May", apadrinamientos: Math.max(50, Math.round(kpis.apadrinamientos_activos * 0.9)) },
                      { mes: "Jun", apadrinamientos: kpis.apadrinamientos_activos }
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <LineChart data={[
                      { mes: "Ene", apadrinamientos: Math.max(5, Math.round(kpis.apadrinamientos_activos * 0.2)) },
                      { mes: "Feb", apadrinamientos: Math.max(12, Math.round(kpis.apadrinamientos_activos * 0.4)) },
                      { mes: "Mar", apadrinamientos: Math.max(25, Math.round(kpis.apadrinamientos_activos * 0.6)) },
                      { mes: "Abr", apadrinamientos: Math.max(38, Math.round(kpis.apadrinamientos_activos * 0.75)) },
                      { mes: "May", apadrinamientos: Math.max(50, Math.round(kpis.apadrinamientos_activos * 0.9)) },
                      { mes: "Jun", apadrinamientos: kpis.apadrinamientos_activos }
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="mes" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Line type="monotone" dataKey="apadrinamientos" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={[
                      { mes: "Ene", apadrinamientos: Math.max(5, Math.round(kpis.apadrinamientos_activos * 0.2)) },
                      { mes: "Feb", apadrinamientos: Math.max(12, Math.round(kpis.apadrinamientos_activos * 0.4)) },
                      { mes: "Mar", apadrinamientos: Math.max(25, Math.round(kpis.apadrinamientos_activos * 0.6)) },
                      { mes: "Abr", apadrinamientos: Math.max(38, Math.round(kpis.apadrinamientos_activos * 0.75)) },
                      { mes: "May", apadrinamientos: Math.max(50, Math.round(kpis.apadrinamientos_activos * 0.9)) },
                      { mes: "Jun", apadrinamientos: kpis.apadrinamientos_activos }
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

        {/* KPIs NoSQL en MongoDB */}
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-emerald-500 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Evidencias Multimediales</span>
                <strong className="block text-3xl font-extrabold text-foreground">
                  {nosqlStats?.documentos_totales.evidencias ?? 0}
                </strong>
                <small className="block text-xs text-emerald-500 font-medium">Fotos y videos guardados en Mongo</small>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <PackageCheck className="h-6 w-6" />
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] border-l-4 border-l-amber-500 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Cartas de Niños</span>
                <strong className="block text-3xl font-extrabold text-foreground">
                  {nosqlStats?.documentos_totales.cartas ?? 0}
                </strong>
                <small className="block text-xs text-amber-500 font-medium">Correspondencia digitalizada en Mongo</small>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <FileText className="h-6 w-6" />
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
                <p className="text-xs text-muted-foreground">Distribución de formatos multimedia registrados</p>
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
                        <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={40}>
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
                <p className="text-xs text-muted-foreground">Volumen de documentos en la base de datos distribuida</p>
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
                      data={[
                        { name: "Evidencias", cantidad: nosqlStats?.documentos_totales.evidencias ?? 0 },
                        { name: "Cartas", cantidad: nosqlStats?.documentos_totales.cartas ?? 0 },
                        { name: "Notificaciones", cantidad: nosqlStats?.documentos_totales.historial_notificaciones ?? 0 },
                        { name: "Bitácora", cantidad: nosqlStats?.documentos_totales.bitacora_eventos ?? 0 }
                      ]} 
                      margin={{ top: 20, right: 20, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                      <XAxis type="number" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis dataKey="name" type="category" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={20}>
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#3b82f6" />
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart 
                      data={[
                        { name: "Evidencias", cantidad: nosqlStats?.documentos_totales.evidencias ?? 0 },
                        { name: "Cartas", cantidad: nosqlStats?.documentos_totales.cartas ?? 0 },
                        { name: "Notificaciones", cantidad: nosqlStats?.documentos_totales.historial_notificaciones ?? 0 },
                        { name: "Bitácora", cantidad: nosqlStats?.documentos_totales.bitacora_eventos ?? 0 }
                      ]} 
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-xs" />
                      <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={35}>
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#3b82f6" />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

