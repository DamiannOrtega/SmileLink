import { useState, useEffect } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApadrinamientosService,
  Apadrinamiento,
  NinosService,
  PadrinosService
} from "@/services/api";

export default function Asignaciones() {
  const navigate = useNavigate();
  const [asignaciones, setAsignaciones] = useState<Apadrinamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ninosMap, setNinosMap] = useState<Map<string, string>>(new Map());
  const [padrinosMap, setPadrinosMap] = useState<Map<string, string>>(new Map());
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("recent");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [asignacionesData, ninosData, padrinosData] = await Promise.all([
        ApadrinamientosService.getAll(),
        NinosService.getAll(),
        PadrinosService.getAll()
      ]);

      setAsignaciones(asignacionesData);
      setNinosMap(new Map(ninosData.map(n => [n.id_nino, n.nombre])));
      setPadrinosMap(new Map(padrinosData.map(p => [p.id_padrino, p.nombre])));
    } catch (err) {
      toast.error("Error al cargar asignaciones");
    } finally {
      setLoading(false);
    }
  };

  const filteredAsignaciones = asignaciones
    .filter((asig) => {
      const ninoNombre = ninosMap.get(asig.id_nino) || "";
      const padrinoNombre = padrinosMap.get(asig.id_padrino) || "";
      const matchesSearch = ninoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        padrinoNombre.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "Todos" || asig.estado_apadrinamiento_registro === statusFilter;
      
      const asigDate = new Date(asig.fecha_inicio);
      const matchesStart = !startDate || asigDate >= new Date(startDate);
      const matchesEnd = !endDate || asigDate <= new Date(endDate);
      
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      const dateA = new Date(a.fecha_inicio).getTime();
      const dateB = new Date(b.fecha_inicio).getTime();
      return sortBy === "recent" ? dateB - dateA : dateA - dateB;
    });

  const getEstadoBadge = (estado: Apadrinamiento["estado_apadrinamiento_registro"]) => {
    return (
      <Badge variant={estado === "Activo" ? "default" : "outline"}>
        {estado}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Asignaciones</h1>
          <p className="text-muted-foreground">Administra los apadrinamientos activos</p>
        </div>
        <Button onClick={() => navigate("/asignaciones/nueva")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Asignación
        </Button>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold">Filtros y Búsqueda</CardTitle>
          {(searchTerm || statusFilter !== "Todos" || sortBy !== "recent" || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("Todos");
                setSortBy("recent");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-3 lg:col-span-4">
              <label className="text-xs font-medium text-muted-foreground">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por niño o padrino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-background/50 border-input/60 focus:border-primary transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                <option value="recent">Más recientes primero</option>
                <option value="oldest">Más antiguos primero</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 bg-background/50 border-input/60 focus:border-primary transition-colors text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 bg-background/50 border-input/60 focus:border-primary transition-colors text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Asignaciones ({filteredAsignaciones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Niño</TableHead>
                <TableHead>Padrino</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Entregas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaciones.map((asig) => (
                <TableRow key={asig.id_apadrinamiento}>
                  <TableCell className="font-mono text-xs">{asig.id_apadrinamiento}</TableCell>
                  <TableCell className="font-medium">{ninosMap.get(asig.id_nino) || "N/A"}</TableCell>
                  <TableCell>{padrinosMap.get(asig.id_padrino) || "N/A"}</TableCell>
                  <TableCell>{asig.tipo_apadrinamiento}</TableCell>
                  <TableCell>{new Date(asig.fecha_inicio).toLocaleDateString()}</TableCell>
                  <TableCell>{asig.fecha_fin ? new Date(asig.fecha_fin).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{getEstadoBadge(asig.estado_apadrinamiento_registro)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{asig.entregas_ids.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/asignaciones/${asig.id_apadrinamiento}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
