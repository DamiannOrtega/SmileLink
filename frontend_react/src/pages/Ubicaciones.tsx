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

  useEffect(() => {
    loadUbicaciones();
  }, [location.key]);

  const loadUbicaciones = async () => {
    try {
      setLoading(true);
      const data = await PuntosEntregaService.getAll();
      const merged = mergePuntosEntrega(data, readInactivePuntosCache());
      setUbicaciones(sortUbicaciones(merged));
    } catch {
      toast.error("Error al cargar ubicaciones");
    } finally {
      setLoading(false);
    }
  };

  const filteredUbicaciones = ubicaciones.filter((ubicacion) => {
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

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, dirección o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {hasActiveFilter && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setSearchTerm("")}
                title="Limpiar filtro"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {hasActiveFilter && (
            <p className="mt-2 text-xs text-muted-foreground">
              Mostrando {filteredUbicaciones.length} de {ubicaciones.length} ubicaciones.
              Si no ves la que acabas de crear, limpia el filtro.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {(["Todos", "Activo", "Inactivo"] as const).map((estado) => (
              <Button
                key={estado}
                type="button"
                size="sm"
                variant={estadoFilter === estado ? "default" : "outline"}
                onClick={() => setEstadoFilter(estado)}
              >
                {estado}
              </Button>
            ))}
          </div>
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
