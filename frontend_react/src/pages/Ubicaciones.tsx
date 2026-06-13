import { useState, useEffect } from "react";
import { Plus, Search, Eye, MapPin, X } from "lucide-react";
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
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PuntosEntregaService, PuntoEntrega } from "@/services/api";
import {
  mergePuntosEntrega,
  readInactivePuntosCache,
} from "@/utils/puntosEntregaCache";

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const sortUbicaciones = (items: PuntoEntrega[]) =>
  [...items].sort(
    (a, b) => Number(b.id_punto_entrega) - Number(a.id_punto_entrega)
  );

export default function Ubicaciones() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ubicaciones, setUbicaciones] = useState<PuntoEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"Todos" | "Activo" | "Inactivo">("Todos");
  const [sortBy, setSortBy] = useState("id_desc");

  useEffect(() => {
    loadUbicaciones();
  }, [location.key]);

  const loadUbicaciones = async () => {
    try {
      setLoading(true);
      const data = await PuntosEntregaService.getAll();
      const merged = mergePuntosEntrega(data, readInactivePuntosCache());
      setUbicaciones(merged);
    } catch {
      toast.error("Error al cargar ubicaciones");
    } finally {
      setLoading(false);
    }
  };

  const filteredUbicaciones = ubicaciones
    .filter((ubicacion) => {
      if (estadoFilter !== "Todos" && ubicacion.estado_punto !== estadoFilter) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const term = normalizeSearch(searchTerm);
      return (
        normalizeSearch(ubicacion.nombre_punto).includes(term) ||
        normalizeSearch(ubicacion.direccion_fisica).includes(term) ||
        normalizeSearch(ubicacion.id_punto_entrega).includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === "id_desc") return b.id_punto_entrega.localeCompare(a.id_punto_entrega, undefined, { numeric: true });
      if (sortBy === "id_asc") return a.id_punto_entrega.localeCompare(b.id_punto_entrega, undefined, { numeric: true });
      if (sortBy === "name_asc") return a.nombre_punto.localeCompare(b.nombre_punto);
      if (sortBy === "name_desc") return b.nombre_punto.localeCompare(a.nombre_punto);
      return 0;
    });

  const hasActiveFilter = searchTerm.trim().length > 0;

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
          <h1 className="text-3xl font-bold text-foreground">Puntos de Entrega</h1>
          <p className="text-muted-foreground">Administra las ubicaciones de entrega</p>
        </div>
        <Button onClick={() => navigate("/ubicaciones/nueva")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold">Filtros y Búsqueda</CardTitle>
          {(searchTerm || estadoFilter !== "Todos" || sortBy !== "id_desc") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setEstadoFilter("Todos");
                setSortBy("id_desc");
              }}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-3 lg:col-span-6">
              <label className="text-xs font-medium text-muted-foreground">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, dirección o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 h-10 bg-background/50 border-input/60 focus:border-primary transition-colors"
                />
                {hasActiveFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setSearchTerm("")}
                    title="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-3">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-3">
              <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input/60 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                <option value="id_desc">ID (Mayor a Menor)</option>
                <option value="id_asc">ID (Menor a Mayor)</option>
                <option value="name_asc">Nombre (A-Z)</option>
                <option value="name_desc">Nombre (Z-A)</option>
              </select>
            </div>
          </div>
          {hasActiveFilter && (
            <p className="mt-2 text-xs text-muted-foreground">
              Mostrando {filteredUbicaciones.length} de {ubicaciones.length} ubicaciones.
              Si no ves la que acabas de crear, limpia el filtro.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Ubicaciones ({filteredUbicaciones.length}
            {hasActiveFilter ? ` de ${ubicaciones.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUbicaciones.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-muted-foreground">
                {hasActiveFilter
                  ? `No hay ubicaciones que coincidan con "${searchTerm}"`
                  : "No hay ubicaciones registradas"}
              </p>
              {hasActiveFilter && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Limpiar filtro
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUbicaciones.map((ubicacion) => (
                  <TableRow key={ubicacion.id_punto_entrega}>
                    <TableCell className="font-mono text-xs">{ubicacion.id_punto_entrega}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {ubicacion.nombre_punto}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{ubicacion.direccion_fisica}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {ubicacion.latitud.toFixed(4)}, {ubicacion.longitud.toFixed(4)}
                    </TableCell>
                    <TableCell>{ubicacion.horario_atencion}</TableCell>
                    <TableCell>{ubicacion.contacto_referencia}</TableCell>
                    <TableCell>
                      <Badge variant={ubicacion.estado_punto === "Activo" ? "default" : "outline"}>
                        {ubicacion.estado_punto}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/ubicaciones/${ubicacion.id_punto_entrega}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
