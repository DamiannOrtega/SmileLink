import { useState, useEffect } from "react";
import { Plus, Search, Eye, MapPin } from "lucide-react";
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
import { PuntosEntregaService, PuntoEntrega } from "@/services/api";

export default function Ubicaciones() {
  const navigate = useNavigate();
  const [ubicaciones, setUbicaciones] = useState<PuntoEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUbicaciones();
  }, []);

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
        </CardContent>
      </Card>
    </div>
  );
}
