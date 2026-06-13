import { useState, useEffect } from "react";
import { Users, Heart, Link2, PackageCheck, AlertCircle, Calendar, FileText, Bell } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
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

      {/* Alertas rápidas */}
      <Card className="border-l-4 border-l-warning bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-warning" />
            Alertas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning" />
              {kpis.solicitudes_abiertas} solicitudes abiertas
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning" />
              {kpis.entregas_pendientes} entregas pendientes de verificación
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              Sistema funcionando correctamente
            </li>
          </ul>
        </CardContent>
      </Card>

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

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
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
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
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

      {/* Sección NoSQL (MongoDB) */}
      <div className="space-y-6 pt-8 border-t border-border mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              Estadísticas Distribuidas NoSQL (MongoDB)
            </h2>
            <p className="text-muted-foreground text-sm">
              Métricas en tiempo real consultadas de colecciones desnormalizadas en el Nodo Secundario
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold px-3 py-1 self-start md:self-auto">
            MongoDB Activo • 10.66.207.161
          </Badge>
        </div>
        
        {/* Documentos totales en Mongo (Solo Evidencias y Cartas) */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Evidencias Multimediales</p>
                <h3 className="text-2xl font-bold tracking-tight">{nosqlStats?.documentos_totales.evidencias ?? 0}</h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                <PackageCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <div className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Cartas de Niños</p>
                <h3 className="text-2xl font-bold tracking-tight">{nosqlStats?.documentos_totales.cartas ?? 0}</h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos de Mongo */}
        <div className="grid gap-6">
          {/* Gráfico 2: Evidencias por Tipo */}
          <Card className="shadow-sm hover:shadow-md transition-all w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Evidencias de Entrega por Tipo de Archivo
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex flex-col items-center justify-center pt-4">
              <div className="w-full h-[80%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nosqlStats?.evidencias_por_tipo ?? []}
                      dataKey="cantidad"
                      nameKey="tipo"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {(nosqlStats?.evidencias_por_tipo ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none" }}
                      itemStyle={{ color: "#f8fafc" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center text-sm mt-2 text-muted-foreground">
                {(nosqlStats?.evidencias_por_tipo ?? []).map((entry, index) => (
                  <div key={entry.tipo} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="capitalize font-medium">{entry.tipo}: {entry.cantidad}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
