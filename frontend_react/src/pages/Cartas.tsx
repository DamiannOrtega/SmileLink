import { useState, useEffect } from "react";
import { Search, Eye, FileText } from "lucide-react";
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
  SolicitudesService,
  SolicitudRegalo,
  NinosService
} from "@/services/api";

export default function Cartas() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudRegalo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ninosMap, setNinosMap] = useState<Map<string, string>>(new Map());
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
      const [solicitudesData, ninosData] = await Promise.all([
        SolicitudesService.getAll(),
        NinosService.getAll()
      ]);

      setSolicitudes(solicitudesData);
      setNinosMap(new Map(ninosData.map(n => [n.id_nino, n.nombre])));
    } catch (err) {
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const filteredSolicitudes = solicitudes
    .filter((solicitud) => {
      const ninoNombre = ninosMap.get(solicitud.id_nino) || "";
      const matchesSearch = ninoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solicitud.descripcion_solicitud.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "Todos" || solicitud.estado_solicitud === statusFilter;
      
      const solicitudDate = new Date(solicitud.fecha_solicitud);
      const matchesStart = !startDate || solicitudDate >= new Date(startDate);
      const matchesEnd = !endDate || solicitudDate <= new Date(endDate);
      
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      const dateA = new Date(a.fecha_solicitud).getTime();
      const dateB = new Date(b.fecha_solicitud).getTime();
      return sortBy === "recent" ? dateB - dateA : dateA - dateB;
    });

  const getEstadoBadge = (estado: SolicitudRegalo["estado_solicitud"]) => {
    const variants: Record<SolicitudRegalo["estado_solicitud"], "default" | "secondary" | "destructive"> = {
      "Abierta": "destructive",
      "En Proceso": "secondary",
      "Cumplida": "default",
    };
    return <Badge variant={variants[estado]}>{estado}</Badge>;
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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Solicitudes de Regalo</h1>
          <p className="text-muted-foreground">Administra las solicitudes de los niños</p>
        </div>
        <Button onClick={() => navigate("/cartas/nueva")}>Nueva Carta</Button>
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
                  placeholder="Buscar por niño o descripción..."
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
                <option value="Abierta">Abierta</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Cumplida">Cumplida</option>
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
          <CardTitle>Lista de Solicitudes ({filteredSolicitudes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Niño</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Fecha Cierre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSolicitudes.map((solicitud) => (
                <TableRow key={solicitud.id_solicitud}>
                  <TableCell className="font-mono text-xs">{solicitud.id_solicitud}</TableCell>
                  <TableCell className="font-medium">
                    {ninosMap.get(solicitud.id_nino) || "N/A"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {solicitud.descripcion_solicitud}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(solicitud.fecha_solicitud).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {solicitud.fecha_cierre
                      ? new Date(solicitud.fecha_cierre).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{getEstadoBadge(solicitud.estado_solicitud)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/cartas/${solicitud.id_solicitud}`)}
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
