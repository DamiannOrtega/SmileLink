import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Eye, MapPin, Trash2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PuntosEntregaService, PuntoEntrega } from "@/services/api";

export default function Ubicaciones() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ubicaciones, setUbicaciones] = useState<PuntoEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ubicacionToDelete, setUbicacionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUbicaciones();
  }, [location.pathname]);

  const loadUbicaciones = async () => {
    try {
      setLoading(true);
      const data = await PuntosEntregaService.getAll();
      setUbicaciones(data);
    } catch (err) {
      toast.error("Error al cargar ubicaciones");
    } finally {
      setLoading(false);
    }
  };

  const filteredUbicaciones = ubicaciones.filter((ubicacion) =>
    ubicacion.nombre_punto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ubicacion.direccion_fisica.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setUbicacionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ubicacionToDelete) return;

    try {
      setDeleting(true);
      await PuntosEntregaService.delete(ubicacionToDelete);
      toast.success("Ubicación eliminada exitosamente");
      setDeleteDialogOpen(false);
      setUbicacionToDelete(null);
      // Recargar la lista
      await loadUbicaciones();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al eliminar ubicación";
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
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
              placeholder="Buscar por nombre o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ubicaciones ({filteredUbicaciones.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/ubicaciones/${ubicacion.id_punto_entrega}`)}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ubicacion.id_punto_entrega)}
                        title="Eliminar ubicación"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Ubicación"
        description="¿Estás seguro de que deseas eliminar esta ubicación? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        confirmText={deleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
