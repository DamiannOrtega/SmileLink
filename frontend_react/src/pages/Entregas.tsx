import { useState, useEffect } from "react";
import { Search, Eye, MapPin } from "lucide-react";
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
  EntregasService,
  Entrega,
  ApadrinamientosService,
  PuntosEntregaService
} from "@/services/api";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const BACKEND_URL = VITE_API_URL && VITE_API_URL !== "/api"
  ? VITE_API_URL.replace("/api", "")
  : "http://10.66.207.165:8000";

export default function Entregas() {
  const navigate = useNavigate();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [puntosMap, setPuntosMap] = useState<Map<string, string>>(new Map());
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
      const [entregasData, puntosData] = await Promise.all([
        EntregasService.getAll(),
        PuntosEntregaService.getAll()
      ]);

      setEntregas(entregasData);
      setPuntosMap(new Map(puntosData.map(p => [p.id_punto_entrega, p.nombre_punto])));
    } catch (err) {
      toast.error("Error al cargar entregas");
    } finally {
      setLoading(false);
    }
  };

  const filteredEntregas = entregas
    .filter((entrega) => {
      const matchesSearch = entrega.descripcion_regalo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || entrega.estado_entrega === statusFilter;
      
      const entregaDate = new Date(entrega.fecha_programada);
      const matchesStart = !startDate || entregaDate >= new Date(startDate);
      const matchesEnd = !endDate || entregaDate <= new Date(endDate);
      
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      const dateA = new Date(a.fecha_programada).getTime();
      const dateB = new Date(b.fecha_programada).getTime();
      return sortBy === "recent" ? dateB - dateA : dateA - dateB;
    });

  const getEstadoBadge = (estado: Entrega["estado_entrega"]) => {
    const variants: Record<Entrega["estado_entrega"], "default" | "secondary" | "destructive"> = {
      "Pendiente": "destructive",
      "En Proceso": "secondary",
      "Entregado": "default",
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

      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Entregas</h1>
        <p className="text-muted-foreground">Administra las entregas de regalos</p>
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
                  placeholder="Buscar por descripción..."
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
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Entregado">Entregado</option>
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
          <CardTitle>Lista de Entregas ({filteredEntregas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Regalo</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Fecha Entrega</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Punto Entrega</TableHead>
                <TableHead>Evidencia</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntregas.map((entrega) => (
                <TableRow key={entrega.id_entrega}>
                  <TableCell className="font-mono text-xs">{entrega.id_entrega}</TableCell>
                  <TableCell className="font-medium">{entrega.descripcion_regalo}</TableCell>
                  <TableCell>{new Date(entrega.fecha_programada).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {entrega.fecha_entrega_real
                      ? new Date(entrega.fecha_entrega_real).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{getEstadoBadge(entrega.estado_entrega)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {puntosMap.get(entrega.id_punto_entrega) || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const firstPhoto = entrega.evidencias_nosql?.find(ev => ev.tipo === "foto");
                      if (firstPhoto) {
                        const fullUrl = firstPhoto.url_archivo.startsWith("http")
                          ? firstPhoto.url_archivo
                          : `${BACKEND_URL}/${firstPhoto.url_archivo}`;
                        return (
                          <img
                            src={fullUrl}
                            alt="Evidencia"
                            className="w-10 h-10 object-cover rounded border border-border cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => navigate(`/entregas/${entrega.id_entrega}`)}
                          />
                        );
                      } else if (entrega.mongo_evidencia_id || entrega.evidencia_foto_path) {
                        return <Badge variant="default">✓ Evidencia</Badge>;
                      } else {
                        return <Badge variant="outline">Sin foto</Badge>;
                      }
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/entregas/${entrega.id_entrega}`)}
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
