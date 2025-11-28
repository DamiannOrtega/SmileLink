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

  const filteredSolicitudes = solicitudes.filter((solicitud) => {
    const ninoNombre = ninosMap.get(solicitud.id_nino) || "";
    return (
      ninoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.descripcion_solicitud.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

      <div>
        <h1 className="text-3xl font-bold text-foreground">Solicitudes de Regalo</h1>
        <p className="text-muted-foreground">Administra las solicitudes de los niños</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por niño o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
