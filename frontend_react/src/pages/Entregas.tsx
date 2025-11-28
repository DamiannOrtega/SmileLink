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

export default function Entregas() {
  const navigate = useNavigate();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [puntosMap, setPuntosMap] = useState<Map<string, string>>(new Map());

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

  const filteredEntregas = entregas.filter((entrega) =>
    entrega.descripcion_regalo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                    {entrega.evidencia_foto_path ? (
                      <Badge variant="default">✓ Foto</Badge>
                    ) : (
                      <Badge variant="outline">Sin foto</Badge>
                    )}
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
