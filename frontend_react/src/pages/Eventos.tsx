import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Calendar } from "lucide-react";
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
import { EventosService, Evento } from "@/services/api";

export default function Eventos() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const data = await EventosService.getAll();
      setEventos(data);
    } catch (err) {
      toast.error("Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  };

  const filteredEventos = eventos
    .filter((evento) => {
      const matchesSearch = evento.nombre_evento.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || evento.estado_evento === statusFilter;
      
      const eventStart = new Date(evento.fecha_inicio);
      const matchesStart = !startDate || eventStart >= new Date(startDate);
      const matchesEnd = !endDate || eventStart <= new Date(endDate);
      
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
      if (sortBy === "oldest") return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime();
      if (sortBy === "name_asc") return a.nombre_evento.localeCompare(b.nombre_evento);
      if (sortBy === "name_desc") return b.nombre_evento.localeCompare(a.nombre_evento);
      return 0;
    });

  const getEstadoBadge = (estado: Evento["estado_evento"]) => {
    const variants: Record<Evento["estado_evento"], "default" | "secondary" | "outline"> = {
      "Planeado": "outline",
      "Activo": "default",
      "Cerrado": "secondary",
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Eventos</h1>
          <p className="text-muted-foreground">Administra los eventos del programa</p>
        </div>
        <Button onClick={() => navigate("/eventos/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Evento
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
                  placeholder="Buscar por nombre..."
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
                <option value="Planeado">Planeado</option>
                <option value="Activo">Activo</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                <option value="recent">Fecha Más reciente</option>
                <option value="oldest">Fecha Más antiguo</option>
                <option value="name_asc">Nombre (A-Z)</option>
                <option value="name_desc">Nombre (Z-A)</option>
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
          <CardTitle>Lista de Eventos ({filteredEventos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEventos.map((evento) => (
                <TableRow key={evento.id_evento}>
                  <TableCell className="font-mono text-xs">{evento.id_evento}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {evento.nombre_evento}
                    </div>
                  </TableCell>
                  <TableCell>{evento.tipo_evento}</TableCell>
                  <TableCell>{new Date(evento.fecha_inicio).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(evento.fecha_fin).toLocaleDateString()}</TableCell>
                  <TableCell>{getEstadoBadge(evento.estado_evento)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/eventos/${evento.id_evento}/editar`)}
                    >
                      <Pencil className="h-4 w-4" />
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
